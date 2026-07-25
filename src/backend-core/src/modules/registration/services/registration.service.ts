import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { uploadImageToCloudinary } from '../../../utils/cloudinary.util';
import { Campaign } from '../../campaign/models/campaign.model';
import { Appointment, AppointmentStatus } from '../../booking/models/appointment.model';
import { ScreeningForm } from '../../booking/models/screening-form.model';
import { ETicket } from '../../booking/models/eticket.model';
import { User } from '../../auth-account/models/user.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { DigitalDonorRecord } from '../models/digital-donor-record.model';
import { AuditLog } from '../models/audit-log.model';

const toObjectId = (idStr: string) => {
  return mongoose.Types.ObjectId.isValid(idStr) ? new mongoose.Types.ObjectId(idStr) : new mongoose.Types.ObjectId();
};

export class RegistrationService {
  /**
   * BC-UC-04: Get campaign donor registrations list with pagination, filtering, and sorting
   */
  static async getCampaignRegistrations(
    campaignIdStr: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      bloodType?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
    },
    actorUserId: string,
    ipAddress?: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(campaignIdStr)) {
      const err: any = new Error('Campaign not found');
      err.statusCode = 404;
      throw err;
    }

    const campaignId = new mongoose.Types.ObjectId(campaignIdStr);

    // 1. Verify campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      const err: any = new Error('Campaign not found');
      err.statusCode = 404;
      throw err;
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { campaignId };

    // Filter by appointment status if provided
    if (query.status) {
      filter.status = query.status;
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      filter.appointmentDate = {};
      if (query.startDate) {
        filter.appointmentDate.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.appointmentDate.$lte = new Date(query.endDate);
      }
    }

    // Filter by bloodType or search term (donor name, CCCD, phone, or registration ID)
    let matchedDonorUserIds: mongoose.Types.ObjectId[] | null = null;

    if (query.bloodType || query.search) {
      const donorFilter: any = {};

      if (query.bloodType) {
        donorFilter.bloodType = query.bloodType;
      }

      if (query.search) {
        const searchRegex = new RegExp(query.search, 'i');
        const userMatches = await User.find({
          $or: [
            { fullName: searchRegex },
            { idDocumentNumber: searchRegex },
            { phone: searchRegex }
          ]
        }).select('_id');

        const profileMatches = await DonorProfile.find({
          $or: [
            { fullName: searchRegex },
            { idDocumentNumber: searchRegex },
            { phoneNumber: searchRegex }
          ]
        }).select('userId');

        const matchingUserIds = [
          ...userMatches.map(u => u._id),
          ...profileMatches.map(p => p.userId)
        ];

        if (query.bloodType) {
          donorFilter.userId = { $in: matchingUserIds };
        } else {
          matchedDonorUserIds = matchingUserIds;
        }
      }

      if (query.bloodType) {
        const matchedProfiles = await DonorProfile.find(donorFilter).select('userId');
        const bloodTypeUserIds = matchedProfiles.map(p => p.userId);
        if (matchedDonorUserIds) {
          matchedDonorUserIds = matchedDonorUserIds.filter(id =>
            bloodTypeUserIds.some(btId => btId.equals(id))
          );
        } else {
          matchedDonorUserIds = bloodTypeUserIds;
        }
      }

      // If search query is a valid ObjectId (registration ID), include it
      if (query.search && mongoose.Types.ObjectId.isValid(query.search)) {
        filter.$or = [
          { donorId: { $in: matchedDonorUserIds || [] } },
          { _id: new mongoose.Types.ObjectId(query.search) }
        ];
      } else {
        filter.donorId = { $in: matchedDonorUserIds || [] };
      }
    }

    // Determine sort
    const sortField = query.sortBy || 'appointmentDate';
    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;
    const sortOptions: any = { [sortField]: sortDirection };

    // Query DB
    const [appointments, totalCount] = await Promise.all([
      Appointment.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(filter)
    ]);

    // Format registration items with populated donor summary
    const items = await Promise.all(
      appointments.map(async (app: any) => {
        const donorUser = await User.findById(app.donorId).lean();
        const donorProfile = await DonorProfile.findOne({ userId: app.donorId }).lean();
        const digitalRecord = await DigitalDonorRecord.findOne({ appointmentId: app._id }).lean();

        const displayStatus: string = digitalRecord?.donationStatus || app.status;

        return {
          registrationId: app._id.toString(),
          campaignId: app.campaignId.toString(),
          donor: {
            donorId: app.donorId.toString(),
            fullName: donorProfile?.fullName || 'N/A',
            idDocumentNumber: donorUser?.idDocumentNumber || donorProfile?.idDocumentNumber || 'N/A',
            phoneNumber: donorProfile?.phoneNumber || donorUser?.phone || 'N/A',
            bloodType: donorProfile?.bloodType || 'Unknown'
          },
          appointmentDate: app.appointmentDate,
          timeSlot: app.timeSlot,
          status: displayStatus,
          createdAt: app.createdAt
        };
      })
    );

    const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 0;

    // Log access in audit_logs
    try {
      await AuditLog.create({
        actorUserId: toObjectId(actorUserId),
        action: 'VIEW_REGISTRATION_LIST',
        resourceType: 'Campaign',
        resourceId: campaignId,
        newValue: { query, page, limit, totalCount },
        ipAddress: ipAddress || '127.0.0.1',
        timestamp: new Date()
      });
    } catch (auditErr) {
      console.error('AuditLog creation warning:', auditErr);
    }

    return {
      items,
      totalCount,
      currentPage: page,
      pageSize: limit,
      totalPages
    };
  }

  /**
   * BC-UC-05 Read: Get full registration details including screening and donor profile
   */
  static async getRegistrationById(registrationIdStr: string) {
    if (!mongoose.Types.ObjectId.isValid(registrationIdStr)) {
      const err: any = new Error('Donor registration record not found');
      err.statusCode = 404;
      throw err;
    }

    const registrationId = new mongoose.Types.ObjectId(registrationIdStr);
    const appointment = await Appointment.findById(registrationId).lean();

    if (!appointment) {
      const err: any = new Error('Donor registration record not found');
      err.statusCode = 404;
      throw err;
    }

    const [donorUser, donorProfile, screeningForm, digitalRecord] = await Promise.all([
      User.findById(appointment.donorId).lean(),
      DonorProfile.findOne({ userId: appointment.donorId }).lean(),
      ScreeningForm.findOne({ appointmentId: registrationId }).lean(),
      DigitalDonorRecord.findOne({ appointmentId: registrationId }).lean()
    ]);

    const displayStatus: string = digitalRecord?.donationStatus || appointment.status;

    return {
      registrationId: appointment._id.toString(),
      campaignId: appointment.campaignId.toString(),
      appointmentDate: appointment.appointmentDate,
      timeSlot: appointment.timeSlot,
      status: displayStatus,
      donor: {
        donorId: appointment.donorId.toString(),
        fullName: donorProfile?.fullName || 'N/A',
        dateOfBirth: donorProfile?.dateOfBirth,
        idDocumentNumber: donorUser?.idDocumentNumber || donorProfile?.idDocumentNumber || 'N/A',
        phoneNumber: donorProfile?.phoneNumber || donorUser?.phone || 'N/A',
        email: donorUser?.email || donorProfile?.email,
        bloodType: donorProfile?.bloodType || 'Unknown',
        permanentAddress: donorProfile?.permanentAddress || 'N/A',
        lastDonationDate: donorProfile?.lastDonationDate,
        totalDonations: donorProfile?.totalDonations || 0
      },
      screening: screeningForm ? {
        screeningFormId: screeningForm._id.toString(),
        medicalHistory: screeningForm.medicalHistory || {},
        currentHealthStatus: screeningForm.currentHealthStatus || 'Healthy',
        recentTravel: screeningForm.recentTravel || 'None',
        medicationHistory: screeningForm.medicationHistory || 'None',
        consentGiven: screeningForm.consentGiven ?? true,
        vitals: (screeningForm as any).vitals || (digitalRecord?.screeningSummary as any)?.staffVitals || null,
        screeningNotes: (screeningForm as any).screeningNotes || digitalRecord?.clinicalNotes || '',
        eligibilityFlag: screeningForm.eligibilityFlag || 'RequiresReview'
      } : null,
      createdAt: (appointment as any).createdAt,
      updatedAt: (appointment as any).updatedAt
    };
  }

  /**
   * BC-UC-05 Write: Update health screening vitals and donor status atomically
   */
  static async updateRegistrationScreening(
    registrationIdStr: string,
    payload: {
      vitals: {
        bloodPressure: string;
        weight: number;
        bodyTemperature: number;
        hemoglobinLevel: number;
      };
      screeningNotes?: string;
      status: 'Pending' | 'Confirmed' | 'Rejected' | 'CheckedIn' | 'Eligible' | 'Ineligible' | 'Completed' | 'Eligible for Donation' | 'Ineligible for Donation' | 'Donation Completed';
    },
    actorUserId: string,
    ipAddress?: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(registrationIdStr)) {
      const err: any = new Error('Donor registration record not found');
      err.statusCode = 404;
      throw err;
    }

    const registrationId = new mongoose.Types.ObjectId(registrationIdStr);
    const appointment = await Appointment.findById(registrationId);

    if (!appointment) {
      const err: any = new Error('Donor registration record not found');
      err.statusCode = 404;
      throw err;
    }

    const previousStatus = appointment.status;
    const previousForm = await ScreeningForm.findOne({ appointmentId: registrationId }).lean();
    const previousVitals = previousForm ? (previousForm as any).vitals : null;

    // Helper for executing screening update
    const executeUpdate = async (session?: mongoose.ClientSession) => {
      const opts = session ? { session } : {};

      // 1. Update or create ScreeningForm
      let screeningForm = await ScreeningForm.findOne({ appointmentId: registrationId }, null, opts);
      const eligibilityFlag = (payload.status === 'Eligible for Donation' || payload.status === 'Eligible') ? 'Eligible' : 'Ineligible';

      if (!screeningForm) {
        screeningForm = new ScreeningForm({
          appointmentId: registrationId,
          medicalHistory: {},
          currentHealthStatus: 'Evaluated by Blood Center Staff',
          recentTravel: 'N/A',
          medicationHistory: 'N/A',
          consentGiven: true,
          eligibilityFlag
        });
      } else {
        screeningForm.eligibilityFlag = eligibilityFlag as any;
        if (!screeningForm.currentHealthStatus) {
          screeningForm.currentHealthStatus = 'Evaluated by Blood Center Staff';
        }
        if (!screeningForm.recentTravel) {
          screeningForm.recentTravel = 'N/A';
        }
        if (!screeningForm.medicationHistory) {
          screeningForm.medicationHistory = 'N/A';
        }
        if (screeningForm.consentGiven === undefined) {
          screeningForm.consentGiven = true;
        }
      }

      (screeningForm as any).vitals = payload.vitals;
      (screeningForm as any).screeningNotes = payload.screeningNotes || '';
      (screeningForm as any).reviewedByStaffId = toObjectId(actorUserId);
      await screeningForm.save(opts);

      // 2. Map payload status to valid AppointmentStatus enum on Appointment model
      let targetAppointmentStatus: AppointmentStatus;
      if (payload.status === 'Donation Completed' || payload.status === 'Completed') {
        targetAppointmentStatus = AppointmentStatus.Completed;
      } else if (payload.status === 'Ineligible for Donation' || payload.status === 'Ineligible' || payload.status === 'Rejected') {
        targetAppointmentStatus = AppointmentStatus.Cancelled;
      } else if (payload.status === 'Confirmed' || payload.status === 'Eligible' || payload.status === 'Eligible for Donation') {
        targetAppointmentStatus = AppointmentStatus.Confirmed;
      } else if (payload.status === 'Pending') {
        targetAppointmentStatus = AppointmentStatus.Pending;
      } else {
        targetAppointmentStatus = AppointmentStatus.CheckedIn;
      }

      // Generate E-Ticket if appointment is confirmed/scheduled and does not have an ETicket yet
      if ((targetAppointmentStatus === AppointmentStatus.Confirmed || (targetAppointmentStatus as any) === AppointmentStatus.Scheduled) && !appointment.eTicketId) {
        const ticketCode = `TK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const qrPayloadSigned = `SIGNED-${ticketCode}`;
        let fileUrl = `https://res.cloudinary.com/lifeline/etickets/${ticketCode}.png`;
        try {
          const qrBuffer = await QRCode.toBuffer(qrPayloadSigned);
          const uploadedUrl = await uploadImageToCloudinary(qrBuffer, 'etickets');
          if (uploadedUrl) fileUrl = uploadedUrl;
        } catch (e) {}

        const newETicket = new ETicket({
          appointmentId: registrationId,
          ticketCode,
          qrPayloadSigned,
          fileUrl,
          issuedAt: new Date()
        });
        await newETicket.save(opts);
        appointment.eTicketId = newETicket._id as any;
      }

      appointment.status = targetAppointmentStatus;
      appointment.screeningFormId = screeningForm._id as any;
      await appointment.save(opts);

      // 3. Map status to DigitalDonorRecord enum: ['Pending', 'Confirmed', 'Rejected', 'CheckedIn', 'Eligible', 'Ineligible', 'Completed']
      let mongoDonationStatus: 'Pending' | 'Confirmed' | 'Rejected' | 'CheckedIn' | 'Eligible' | 'Ineligible' | 'Completed';
      if (payload.status === 'Eligible for Donation' || payload.status === 'Eligible') mongoDonationStatus = 'Eligible';
      else if (payload.status === 'Ineligible for Donation' || payload.status === 'Ineligible') mongoDonationStatus = 'Ineligible';
      else if (payload.status === 'Donation Completed' || payload.status === 'Completed') mongoDonationStatus = 'Completed';
      else if (payload.status === 'Confirmed') mongoDonationStatus = 'Confirmed';
      else if (payload.status === 'Rejected') mongoDonationStatus = 'Rejected';
      else if (payload.status === 'CheckedIn') mongoDonationStatus = 'CheckedIn';
      else mongoDonationStatus = 'Pending';

      let digitalRecord = await DigitalDonorRecord.findOne({ appointmentId: registrationId }, null, opts);
      if (!digitalRecord) {
        digitalRecord = new DigitalDonorRecord({
          appointmentId: registrationId,
          donorId: appointment.donorId,
          screeningSummary: { staffVitals: payload.vitals },
          donationStatus: mongoDonationStatus,
          clinicalNotes: payload.screeningNotes || '',
          lastUpdatedAt: new Date()
        });
      } else {
        const existingSummary = (digitalRecord.screeningSummary as Record<string, any>) || {};
        digitalRecord.screeningSummary = {
          ...existingSummary,
          staffVitals: payload.vitals
        };
        digitalRecord.donationStatus = mongoDonationStatus;
        digitalRecord.clinicalNotes = payload.screeningNotes || '';
        digitalRecord.lastUpdatedAt = new Date();
      }
      await digitalRecord.save(opts);

      // 4. Create AuditLog entry
      await AuditLog.create([{
        actorUserId: toObjectId(actorUserId),
        action: 'UPDATE_REGISTRATION_SCREENING',
        resourceType: 'Registration',
        resourceId: registrationId,
        previousValue: { status: previousStatus, vitals: previousVitals },
        newValue: payload,
        timestamp: new Date(),
        ipAddress: ipAddress || '127.0.0.1'
      }], opts);
    };

    // Attempt transactional execution
    let session: mongoose.ClientSession | null = null;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        await executeUpdate(session!);
      });
    } catch (txError: any) {
      console.error('TxError details:', txError?.errInfo ? JSON.stringify(txError.errInfo, null, 2) : txError);
      // Fallback for standalone MongoDB environments where transactions are not supported
      try {
        await executeUpdate();
      } catch (fallbackError: any) {
        console.error('FallbackError details:', fallbackError?.errInfo ? JSON.stringify(fallbackError.errInfo, null, 2) : fallbackError);
        throw fallbackError;
      }
    } finally {
      if (session) {
        session.endSession();
      }
    }

    return await RegistrationService.getRegistrationById(registrationIdStr);
  }
}
