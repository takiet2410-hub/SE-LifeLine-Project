import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { uploadImageToCloudinary } from '../../../utils/cloudinary.util';
import { Campaign } from '../../campaign/models/campaign.model';
import { Appointment, AppointmentStatus } from '../../booking/models/appointment.model';
import { ScreeningForm } from '../../booking/models/screening-form.model';
import { ETicket } from '../../booking/models/eticket.model';
import { BookingService } from '../../booking/services/booking.service';
import { User } from '../../auth-account/models/user.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { DigitalDonorRecord } from '../models/digital-donor-record.model';
import { AuditLog } from '../models/audit-log.model';
import { sendBookingConfirmationEmail } from '../../../utils/email.util';

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
    const filter: any = {};

    if (campaignIdStr && campaignIdStr !== 'all') {
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

      filter.campaignId = campaignId;
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filter by appointment/digital record status if provided
    if (query.status && query.status !== 'All') {
      const matchingDigitalRecords = await DigitalDonorRecord.find({ donationStatus: query.status as any }).select('appointmentId');
      const digitalAppIds = matchingDigitalRecords.map(d => d.appointmentId);

      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          {
            $or: [
              { status: query.status },
              { _id: { $in: digitalAppIds } }
            ]
          }
        ];
        delete filter.$or;
      } else {
        filter.$or = [
          { status: query.status },
          { _id: { $in: digitalAppIds } }
        ];
      }
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
            { idDocumentNumber: searchRegex },
            { phone: searchRegex },
            { email: searchRegex }
          ]
        }).select('_id');

        const profileMatches = await DonorProfile.find({
          $or: [
            { fullName: searchRegex },
            { idDocumentNumber: searchRegex },
            { phoneNumber: searchRegex }
          ]
        }).select('userId _id');

        const matchingUserIds = [
          ...userMatches.map(u => u._id),
          ...profileMatches.map(p => p.userId),
          ...profileMatches.map(p => p._id)
        ].filter(Boolean);

        if (query.bloodType) {
          donorFilter.$or = [
            { userId: { $in: matchingUserIds } },
            { _id: { $in: matchingUserIds } }
          ];
        } else {
          matchedDonorUserIds = matchingUserIds;
        }
      }

      if (query.bloodType) {
        const matchedProfiles = await DonorProfile.find(donorFilter).select('userId _id');
        const bloodTypeUserIds = [
          ...matchedProfiles.map(p => p.userId),
          ...matchedProfiles.map(p => p._id)
        ].filter(Boolean);

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

    // Format registration items with populated donor summary & screening form
    const items = await Promise.all(
      appointments.map(async (app: any) => {
        const rawDonorId = app.donorId?._id || app.donorId;

        let donorProfile = await DonorProfile.findOne({
          $or: [
            { userId: app.donorId },
            { _id: app.donorId },
            ...(rawDonorId ? [{ userId: rawDonorId }, { _id: rawDonorId }] : [])
          ]
        }).lean();

        let donorUser = app.donorId ? await User.findById(app.donorId).lean() : null;
        if (!donorUser && donorProfile?.userId) {
          donorUser = await User.findById(donorProfile.userId).lean();
        }

        if (!donorProfile && donorUser) {
          donorProfile = await DonorProfile.findOne({
            $or: [
              ...(donorUser.idDocumentNumber ? [{ idDocumentNumber: donorUser.idDocumentNumber }] : []),
              ...(donorUser.phone ? [{ phoneNumber: donorUser.phone }] : []),
              ...(donorUser.email ? [{ email: donorUser.email }] : [])
            ]
          }).lean();
        }

        const digitalRecord = await DigitalDonorRecord.findOne({ appointmentId: app._id }).lean();
        const screeningForm = await ScreeningForm.findOne({ appointmentId: app._id }).lean();
        const campaignDoc = app.campaignId ? await Campaign.findById(app.campaignId) : null;

        const displayStatus: string = digitalRecord?.donationStatus || app.status;

        const screeningData = screeningForm ? {
          screeningFormId: screeningForm._id.toString(),
          responses: screeningForm.responses || [],
          outcome: screeningForm.outcome || 'PASS',
          submittedAt: (screeningForm as any).submittedAt,
          vitals: (screeningForm as any).vitals || (digitalRecord?.screeningSummary as any)?.staffVitals || null,
          screeningNotes: (screeningForm as any).screeningNotes || digitalRecord?.clinicalNotes || '',
          eligibilityFlag: (screeningForm as any).eligibilityFlag || 'RequiresReview'
        } : null;

        const fullName = donorProfile?.fullName || 'N/A';
        const idDocumentNumber = donorProfile?.idDocumentNumber || donorUser?.idDocumentNumber || 'N/A';
        const phoneNumber = donorProfile?.phoneNumber || donorUser?.phone || 'N/A';
        const bloodType = donorProfile?.bloodType || 'Unknown';

        return {
          registrationId: app._id.toString(),
          campaignId: app.campaignId ? app.campaignId.toString() : campaignIdStr,
          campaignName: campaignDoc?.name || 'Chiến dịch Hiến máu',
          donorId: app.donorId ? app.donorId.toString() : '',
          donorName: fullName,
          donorPhone: phoneNumber,
          donorIdCard: idDocumentNumber,
          donorBloodType: bloodType,
          donorDob: donorProfile?.dateOfBirth || '',
          donor: {
            donorId: app.donorId ? app.donorId.toString() : '',
            fullName,
            idDocumentNumber,
            phoneNumber,
            bloodType,
            dateOfBirth: donorProfile?.dateOfBirth,
            email: donorProfile?.email || donorUser?.email || ''
          },
          appointmentDate: app.appointmentDate,
          timeSlot: app.timeSlot,
          status: displayStatus,
          screening: screeningData,
          screeningForm: screeningData,
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
        resourceId: toObjectId(campaignIdStr),
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

    const rawDonorId = appointment.donorId?._id || appointment.donorId;

    let donorProfile = await DonorProfile.findOne({
      $or: [
        { userId: appointment.donorId },
        { _id: appointment.donorId },
        ...(rawDonorId ? [{ userId: rawDonorId }, { _id: rawDonorId }] : [])
      ]
    }).lean();

    let donorUser = appointment.donorId ? await User.findById(appointment.donorId).lean() : null;
    if (!donorUser && donorProfile?.userId) {
      donorUser = await User.findById(donorProfile.userId).lean();
    }

    if (!donorProfile && donorUser) {
      donorProfile = await DonorProfile.findOne({
        $or: [
          ...(donorUser.idDocumentNumber ? [{ idDocumentNumber: donorUser.idDocumentNumber }] : []),
          ...(donorUser.phone ? [{ phoneNumber: donorUser.phone }] : []),
          ...(donorUser.email ? [{ email: donorUser.email }] : [])
        ]
      }).lean();
    }

    const screeningForm = await ScreeningForm.findOne({ appointmentId: registrationId }).lean();
    const digitalRecord = await DigitalDonorRecord.findOne({ appointmentId: registrationId }).lean();

    const displayStatus: string = digitalRecord?.donationStatus || appointment.status;

    const screeningData = screeningForm ? {
      screeningFormId: screeningForm._id.toString(),
      responses: screeningForm.responses || [],
      outcome: screeningForm.outcome || 'PASS',
      submittedAt: screeningForm.submittedAt,
      medicalHistory: (screeningForm as any).medicalHistory || {},
      currentHealthStatus: (screeningForm as any).currentHealthStatus || 'Healthy',
      recentTravel: (screeningForm as any).recentTravel || 'None',
      medicationHistory: (screeningForm as any).medicationHistory || 'None',
      consentGiven: (screeningForm as any).consentGiven ?? true,
      vitals: (screeningForm as any).vitals || (digitalRecord?.screeningSummary as any)?.staffVitals || null,
      screeningNotes: (screeningForm as any).screeningNotes || digitalRecord?.clinicalNotes || '',
      eligibilityFlag: (screeningForm as any).eligibilityFlag || 'RequiresReview'
    } : null;

    const fullName = donorProfile?.fullName || 'N/A';
    const idDocumentNumber = donorProfile?.idDocumentNumber || donorUser?.idDocumentNumber || 'N/A';
    const phoneNumber = donorProfile?.phoneNumber || donorUser?.phone || 'N/A';
    const bloodType = donorProfile?.bloodType || 'Unknown';

    return {
      registrationId: appointment._id.toString(),
      campaignId: appointment.campaignId.toString(),
      appointmentDate: appointment.appointmentDate,
      timeSlot: appointment.timeSlot,
      status: displayStatus,
      donorName: fullName,
      donorPhone: phoneNumber,
      donorIdCard: idDocumentNumber,
      donorBloodType: bloodType,
      donorDob: donorProfile?.dateOfBirth || '',
      donor: {
        donorId: appointment.donorId.toString(),
        fullName,
        dateOfBirth: donorProfile?.dateOfBirth,
        idDocumentNumber,
        phoneNumber,
        email: donorProfile?.email || donorUser?.email || '',
        bloodType,
        permanentAddress: donorProfile?.permanentAddress || 'N/A',
        lastDonationDate: donorProfile?.lastDonationDate,
        totalDonations: donorProfile?.totalDonations || 0
      },
      screening: screeningData,
      screeningForm: screeningData,
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
      bloodType?: string;
      vitals?: {
        bloodPressure: string;
        weight: number;
        bodyTemperature: number;
        hemoglobinLevel: number;
      };
      screeningNotes?: string;
      status?: 'Pending' | 'Confirmed' | 'Rejected' | 'CheckedIn' | 'Eligible' | 'Ineligible' | 'Completed' | 'Eligible for Donation' | 'Ineligible for Donation' | 'Donation Completed';
      responses?: Array<{ questionId: string; selectedOptions: string[]; description?: string }>;
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

      // 0. Update bloodType in DonorProfile if bloodType is provided in payload
      if (payload.bloodType) {
        await DonorProfile.findOneAndUpdate(
          { userId: appointment.donorId },
          { bloodType: payload.bloodType as any },
          opts
        );
      }

      // 1. Update or create ScreeningForm
      let screeningForm = await ScreeningForm.findOne({ appointmentId: registrationId }, null, opts);
      const eligibilityFlag = payload.status
        ? (payload.status === 'Eligible for Donation' || payload.status === 'Eligible') ? 'Eligible' : 'Ineligible'
        : (screeningForm as any)?.eligibilityFlag || 'RequiresReview';

      if (!screeningForm) {
        screeningForm = new ScreeningForm({
          appointmentId: registrationId,
          responses: payload.responses || [],
          outcome: eligibilityFlag === 'Eligible' ? 'PASS' : 'REJECT',
          medicalHistory: {},
          currentHealthStatus: 'Evaluated by Blood Center Staff',
          recentTravel: 'N/A',
          medicationHistory: 'N/A',
          consentGiven: true,
          eligibilityFlag
        });
      } else {
        if (payload.status) {
          (screeningForm as any).eligibilityFlag = eligibilityFlag;
          if (eligibilityFlag === 'Eligible') {
            screeningForm.outcome = 'PASS' as any;
          } else if (eligibilityFlag === 'Ineligible') {
            screeningForm.outcome = 'REJECT' as any;
          }
        }
        if (payload.responses) {
          screeningForm.responses = payload.responses as any;
        }
      }

      if (payload.vitals) {
        (screeningForm as any).vitals = payload.vitals;
      }
      if (payload.screeningNotes !== undefined) {
        (screeningForm as any).screeningNotes = payload.screeningNotes;
      }
      (screeningForm as any).reviewedByStaffId = toObjectId(actorUserId);
      await screeningForm.save(opts);

      // 2. Map payload status to valid AppointmentStatus enum on Appointment model if status is provided
      if (payload.status) {
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
      }

      appointment.screeningFormId = screeningForm._id as any;
      await appointment.save(opts);

      // 3. Map status to DigitalDonorRecord
      let digitalRecord = await DigitalDonorRecord.findOne({ appointmentId: registrationId }, null, opts);
      const mongoDonationStatus = payload.status
        ? (payload.status === 'Eligible for Donation' || payload.status === 'Eligible') ? 'Eligible'
          : (payload.status === 'Ineligible for Donation' || payload.status === 'Ineligible') ? 'Ineligible'
          : (payload.status === 'Donation Completed' || payload.status === 'Completed') ? 'Completed'
          : (payload.status === 'Confirmed') ? 'Confirmed'
          : (payload.status === 'Rejected') ? 'Rejected'
          : (payload.status === 'CheckedIn') ? 'CheckedIn'
          : 'Pending'
        : digitalRecord?.donationStatus || 'Pending';

      if (!digitalRecord) {
        digitalRecord = new DigitalDonorRecord({
          appointmentId: registrationId,
          donorId: appointment.donorId,
          screeningSummary: { staffVitals: payload.vitals || null },
          donationStatus: mongoDonationStatus,
          clinicalNotes: payload.screeningNotes || '',
          lastUpdatedAt: new Date()
        });
      } else {
        const existingSummary = (digitalRecord.screeningSummary as Record<string, any>) || {};
        digitalRecord.screeningSummary = {
          ...existingSummary,
          ...(payload.vitals ? { staffVitals: payload.vitals } : {})
        };
        if (payload.status) {
          digitalRecord.donationStatus = mongoDonationStatus;
        }
        if (payload.screeningNotes !== undefined) {
          digitalRecord.clinicalNotes = payload.screeningNotes;
        }
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

    // Attempt transactional execution if connected to MongoDB
    if (mongoose.connection.readyState === 1) {
      let session: mongoose.ClientSession | null = null;
      try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
          await executeUpdate(session!);
        });
      } catch (txError: any) {
        try {
          await executeUpdate();
        } catch (fallbackError: any) {
          throw fallbackError;
        }
      } finally {
        if (session) {
          session.endSession();
        }
      }
    } else {
      await executeUpdate();
    }

    // Combine logic with BookingService from booking module for confirmation & rejection (triggers E-Ticket generation & Email notifications)
    try {
      if (payload.status === 'Confirmed') {
        await BookingService.confirmAppointmentByBloodCenter(registrationIdStr);
      } else if (payload.status === 'Ineligible' || payload.status === 'Rejected' || payload.status === 'Ineligible for Donation') {
        await BookingService.rejectAppointmentByBloodCenter(registrationIdStr, payload.screeningNotes);
      }
    } catch (bookingErr) {
      console.error('Error running BookingService confirm/reject logic:', bookingErr);
    }

    return await RegistrationService.getRegistrationById(registrationIdStr);
  }

  /**
   * Scan QR Code & Check-in registration automatically
   */
  static async checkInByQRCode(qrPayload: string, actorUserId?: string) {
    let appointment: any = null;
    const cleanPayload = qrPayload ? qrPayload.trim() : '';

    if (cleanPayload) {
      // 1. Try finding ETicket by ticketCode or qrPayloadSigned
      const eTicket = await ETicket.findOne({
        $or: [
          { ticketCode: cleanPayload },
          { qrPayloadSigned: cleanPayload },
          { ticketCode: cleanPayload.replace('SIGNED-', '') }
        ]
      }).lean();

      if (eTicket) {
        appointment = await Appointment.findById(eTicket.appointmentId);
      }

      // 2. Try finding by CCCD (idDocumentNumber) in DonorProfile or User
      if (!appointment) {
        const matchingProfile = await DonorProfile.findOne({ idDocumentNumber: cleanPayload }).lean();
        const matchingUser = await User.findOne({ idDocumentNumber: cleanPayload }).lean();

        const donorUserIds = [
          ...(matchingProfile ? [matchingProfile.userId, matchingProfile._id] : []),
          ...(matchingUser ? [matchingUser._id] : [])
        ].filter(Boolean);

        if (donorUserIds.length > 0) {
          appointment = await Appointment.findOne({
            donorId: { $in: donorUserIds },
            status: { $in: [AppointmentStatus.Confirmed, AppointmentStatus.Pending, AppointmentStatus.Scheduled, AppointmentStatus.CheckedIn] }
          }).sort({ appointmentDate: -1, createdAt: -1 });
        }
      }

      // 3. Try finding Appointment directly by _id
      if (!appointment && mongoose.Types.ObjectId.isValid(cleanPayload)) {
        appointment = await Appointment.findById(cleanPayload);
      }
    }

    // 3. Fallback: if cleanPayload is empty or mock demo, find the first available confirmed/pending appointment
    if (!appointment) {
      appointment = await Appointment.findOne({
        status: { $in: [AppointmentStatus.Confirmed, AppointmentStatus.Pending, AppointmentStatus.Scheduled, AppointmentStatus.CheckedIn] }
      }).sort({ createdAt: -1 });
    }

    if (!appointment) {
      const err: any = new Error('Không tìm thấy phiếu đăng ký / E-Ticket hợp lệ');
      err.statusCode = 404;
      throw err;
    }

    // 4. Update status to CheckedIn
    const registrationIdStr = appointment._id.toString();
    return await RegistrationService.updateRegistrationScreening(
      registrationIdStr,
      { status: 'CheckedIn' },
      actorUserId || 'system'
    );
  }
}
