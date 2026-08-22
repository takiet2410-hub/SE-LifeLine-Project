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
import { GamificationService } from '../../auth-account/services/gamification.service';
import { sendBookingConfirmationEmail } from '../../../utils/email.util';
import { emitDonationCompleted, emitEligibilityCheckFailed } from '../../notification/services/notification.events';
import { BloodBag } from '../../blood-inventory/models/blood-bag.model';

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
      const statusRegex = new RegExp(`^${query.status}$`, 'i');
      const matchingDigitalRecords = await DigitalDonorRecord.find({ donationStatus: { $regex: statusRegex } }).select('appointmentId');
      const digitalAppIds = matchingDigitalRecords.map(d => d.appointmentId);

      const statusOrClause = [
        { status: { $regex: statusRegex } },
        { _id: { $in: digitalAppIds } }
      ];

      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: statusOrClause }
        ];
        delete filter.$or;
      } else {
        filter.$or = statusOrClause;
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
          const orConditions = [];
          if (donorUser.idDocumentNumber) orConditions.push({ idDocumentNumber: donorUser.idDocumentNumber });
          if (donorUser.phone) orConditions.push({ phoneNumber: donorUser.phone });
          if (donorUser.email) orConditions.push({ email: donorUser.email });

          if (orConditions.length > 0) {
            donorProfile = await DonorProfile.findOne({ $or: orConditions }).lean();
          }
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

        const fullName = donorProfile?.fullName || (donorUser as any)?.fullName || 'Người hiến máu';
        const idDocumentNumber = donorProfile?.idDocumentNumber || donorUser?.idDocumentNumber || 'Chưa cập nhật';
        const phoneNumber = donorProfile?.phoneNumber || donorUser?.phone || (donorUser as any)?.phoneNumber || 'Chưa cập nhật SĐT';
        const bloodType = donorProfile?.bloodType || (donorUser as any)?.bloodType || 'Unknown';
        const donorDob = donorProfile?.dateOfBirth || (donorUser as any)?.dateOfBirth || '';

        return {
          _id: app._id.toString(),
          registrationId: app._id.toString(),
          campaignId: app.campaignId ? app.campaignId.toString() : campaignIdStr,
          campaignName: campaignDoc?.name || 'Chiến dịch Hiến máu',
          campaignVenue: campaignDoc?.venue || (campaignDoc as any)?.fullAddress || (campaignDoc as any)?.location || '',
          donorId: app.donorId ? app.donorId.toString() : '',
          donorName: fullName,
          donorPhone: phoneNumber,
          donorIdCard: idDocumentNumber,
          donorBloodType: bloodType,
          donorDob,
          donor: {
            donorId: app.donorId ? app.donorId.toString() : '',
            fullName,
            idDocumentNumber,
            phoneNumber,
            bloodType,
            dateOfBirth: donorDob,
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
      const orConditions = [];
      if (donorUser.idDocumentNumber) orConditions.push({ idDocumentNumber: donorUser.idDocumentNumber });
      if (donorUser.phone) orConditions.push({ phoneNumber: donorUser.phone });
      if (donorUser.email) orConditions.push({ email: donorUser.email });

      if (orConditions.length > 0) {
        donorProfile = await DonorProfile.findOne({ $or: orConditions }).lean();
      }
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

    // Fetch real donor donation history from appointments collection (ONLY Completed donations)
    const donorIdQuery = appointment.donorId?._id || appointment.donorId;
    let historyAppointments: any[] = [];
    if (donorIdQuery) {
      try {
        const findRes: any = Appointment.find({
          donorId: donorIdQuery,
          status: AppointmentStatus.Completed
        });
        if (findRes && typeof findRes.populate === 'function') {
          const popRes = findRes.populate('campaignId');
          const sortRes = popRes && typeof popRes.sort === 'function' ? popRes.sort({ appointmentDate: -1 }) : popRes;
          if (sortRes && typeof sortRes.lean === 'function') {
            historyAppointments = (await sortRes.lean()) || [];
          }
        }
      } catch (e) {
        historyAppointments = [];
      }
    }

    const donationHistory = historyAppointments.map((app: any) => {
      const campaignObj = typeof app.campaignId === 'object' ? app.campaignId : null;
      const vol = app.donationVolume ? `${app.donationVolume} ml` : '350 ml';
      return {
        _id: app._id.toString(),
        appointmentDate: app.appointmentDate,
        timeSlot: app.timeSlot,
        donationType: 'Máu toàn phần',
        volume: vol,
        locationName: campaignObj?.name || 'Điểm hiến máu LifeLine',
        status: app.status
      };
    });

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
        totalDonations: donorProfile?.totalDonations || donationHistory.length
      },
      screening: screeningData,
      screeningForm: screeningData,
      donationHistory,
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
      donationVolume?: number;
      status?: 'Pending' | 'Confirmed' | 'Rejected' | 'CheckedIn' | 'Examining' | 'Eligible' | 'Ineligible' | 'Completed' | 'Eligible for Donation' | 'Ineligible for Donation' | 'Donation Completed';
      testResult?: 'Pass' | 'Rejected';
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

    // Validate campaign status if transitioning to CheckedIn or later stages (Examining, Eligible, Completed)
    const targetStatus = payload.status;
    const isAdvancingToCheckInOrBeyond =
      targetStatus === 'CheckedIn' ||
      targetStatus === 'Examining' ||
      targetStatus === 'Eligible' ||
      targetStatus === 'Eligible for Donation' ||
      targetStatus === 'Completed' ||
      targetStatus === 'Donation Completed';

    if (isAdvancingToCheckInOrBeyond && appointment.campaignId) {
      const campaign = await Campaign.findById(appointment.campaignId);
      if (campaign && campaign.status !== 'Active' && campaign.status !== 'Completed') {
        const err: any = new Error('Chiến dịch chưa diễn ra (chưa mở).');
        err.statusCode = 400;
        throw err;
      }
    }

    // Helper for executing screening update
    const executeUpdate = async (session?: mongoose.ClientSession) => {
      const opts = session ? { session } : {};

      // 0. Update bloodType in DonorProfile if bloodType is provided in payload
      if (payload.bloodType) {
        await DonorProfile.findOneAndUpdate(
          { 
            $or: [
              { userId: appointment.donorId },
              { _id: appointment.donorId }
            ]
          },
          { $set: { bloodType: payload.bloodType as any } },
          opts
        );
      }

      // 1. Update or create ScreeningForm
      let screeningForm = await ScreeningForm.findOne({ appointmentId: registrationId }, null, opts);

      let eligibilityFlag = (screeningForm as any)?.eligibilityFlag || 'RequiresReview';
      let outcome = (screeningForm as any)?.outcome || 'PASS';

      if (payload.status === 'Eligible' || payload.status === 'Eligible for Donation') {
        let digitalRec = await DigitalDonorRecord.findOne({ appointmentId: registrationId }, null, opts).lean();
        const existingVitals = (digitalRec?.screeningSummary as any)?.staffVitals || (screeningForm as any)?.vitals;
        const finalVitals = payload.vitals || existingVitals;

        if (
          !finalVitals ||
          !finalVitals.bloodPressure ||
          !finalVitals.weight ||
          !finalVitals.bodyTemperature ||
          !finalVitals.hemoglobinLevel
        ) {
          const err: any = new Error(
            'Vui lòng nhập đầy đủ các chỉ số sinh tồn (Huyết áp, Cân nặng, Thân nhiệt, Hemoglobin) trong phần Khám lâm sàng trước khi chuyển sang trạng thái Đủ Điều Kiện!'
          );
          err.statusCode = 400;
          throw err;
        }
      }

      if (payload.status) {
        const statusStr = payload.status as string;
        if (
          statusStr === 'Eligible for Donation' ||
          statusStr === 'Eligible' ||
          statusStr === 'Examining' ||
          statusStr === 'Confirmed' ||
          statusStr === 'CheckedIn' ||
          statusStr === 'Completed' ||
          statusStr === 'Donation Completed'
        ) {
          eligibilityFlag = 'Eligible';
          outcome = 'PASS';
        } else if (
          statusStr === 'Ineligible for Donation' ||
          statusStr === 'Ineligible' ||
          statusStr === 'Rejected' ||
          (payload.status as string) === 'Cancelled'
        ) {
          eligibilityFlag = 'Ineligible';
          outcome = 'REJECT';
        }
      }

      if (!screeningForm) {
        screeningForm = new ScreeningForm({
          appointmentId: registrationId,
          responses: payload.responses || [],
          outcome: outcome as any,
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
          screeningForm.outcome = outcome as any;
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
      if (payload.testResult !== undefined) {
        (screeningForm as any).testResult = payload.testResult;
      }
      (screeningForm as any).reviewedByStaffId = toObjectId(actorUserId);
      await screeningForm.save(opts);

      // Auto-set status to Completed if testResult (Pass/Rejected) is submitted without explicit status
      if (payload.testResult && !payload.status) {
        payload.status = 'Completed';
      }

      // 2. Map payload status to valid AppointmentStatus enum on Appointment model if status is provided
      if (payload.status) {
        let targetAppointmentStatus: AppointmentStatus;
        if (payload.status === 'Donation Completed' || payload.status === 'Completed') {
          targetAppointmentStatus = AppointmentStatus.Completed;
        } else if (payload.status === 'Ineligible for Donation' || payload.status === 'Ineligible' || payload.status === 'Rejected') {
          targetAppointmentStatus = AppointmentStatus.Rejected;
        } else if (payload.status === 'Confirmed' || payload.status === 'Eligible' || payload.status === 'Eligible for Donation') {
          targetAppointmentStatus = AppointmentStatus.Confirmed;
        } else if (payload.status === 'Examining') {
          targetAppointmentStatus = AppointmentStatus.Examining;
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

        // If appointment transitions to Rejected from an active status, replenish the slots
        const activeStatuses = [AppointmentStatus.Pending, AppointmentStatus.Confirmed, AppointmentStatus.Scheduled, AppointmentStatus.CheckedIn, AppointmentStatus.Eligible];
        if (targetAppointmentStatus === AppointmentStatus.Rejected && activeStatuses.includes(previousStatus)) {
          const appDateStr = appointment.appointmentDate instanceof Date 
            ? appointment.appointmentDate.toISOString().split('T')[0] 
            : String(appointment.appointmentDate).split('T')[0];
          
          await BookingService.decrementCampaignSlot(appointment.campaignId, appDateStr, appointment.timeSlot, session);
        }

        // Process Gamification (+250 XP & Achievement unlocking) when donation is completed
        if (targetAppointmentStatus === AppointmentStatus.Completed && !appointment.xpRewardedForCompletion) {
          try {
            await GamificationService.processDonationCompletion(appointment.donorId, appointment.appointmentDate);
            
            // Fire DonationCompleted event to notify user
            const donorProfile = await DonorProfile.findOne({ userId: appointment.donorId }).lean() as any;
            const donorUser = await User.findById(appointment.donorId).lean() as any;
            if (donorUser || donorProfile) {
              const nextEligibleDate = new Date();
              nextEligibleDate.setDate(nextEligibleDate.getDate() + 84); // 84 days wait time for whole blood
              const campaign = typeof appointment.campaignId === 'object' ? appointment.campaignId : await Campaign.findById(appointment.campaignId).lean();
              const donorName = donorProfile?.fullName || donorUser?.fullName || 'Người hiến máu';
              const rawCampaignName = (campaign as any)?.name;
              const campaignName = (rawCampaignName && typeof rawCampaignName === 'string' && rawCampaignName.trim())
                ? rawCampaignName.trim()
                : 'Trung tâm tiếp nhận máu LifeLine';
              
              await emitDonationCompleted({
                donorId: appointment.donorId.toString(),
                donorName,
                campaignName,
                volume: payload.donationVolume || (appointment as any).donationVolume || 350,
                bloodType: payload.bloodType || donorProfile?.bloodType || 'Chưa xác định',
                donationDate: new Date().toLocaleDateString('vi-VN'),
                nextEligibleDate: nextEligibleDate.toLocaleDateString('vi-VN'),
                deepLink: '/profile',
                audienceRole: 'Donor',
              });
            }
          } catch (gErr) {
            console.error('Error processing gamification/notification logic:', gErr);
          }
        }
        
        // Process Eligibility Check Failed notification when rejected during screening/examining
        if (targetAppointmentStatus === AppointmentStatus.Rejected && previousStatus !== AppointmentStatus.Rejected) {
          try {
            const donorProfile = await DonorProfile.findOne({
              $or: [{ userId: appointment.donorId }, { _id: appointment.donorId }]
            }).lean() as any;
            const donorUser = await User.findById(donorProfile?.userId || appointment.donorId).lean() as any;
            if (donorUser || donorProfile) {
              const donorName = donorProfile?.fullName || donorUser?.fullName || 'Người hiến máu';
              const campaign = typeof appointment.campaignId === 'object' ? appointment.campaignId : await Campaign.findById(appointment.campaignId).lean();
              const rawCampaignName = (campaign as any)?.name;
              const campaignName = (rawCampaignName && typeof rawCampaignName === 'string' && rawCampaignName.trim())
                ? rawCampaignName.trim()
                : 'Trung tâm tiếp nhận máu LifeLine';

              const appDateStr = appointment.appointmentDate instanceof Date
                ? appointment.appointmentDate.toLocaleDateString('vi-VN')
                : new Date(appointment.appointmentDate).toLocaleDateString('vi-VN');

              const reason = payload.screeningNotes || (screeningForm as any)?.screeningNotes || 'Chưa đủ điều kiện sức khỏe hoặc thuộc trường hợp tạm hoãn hiến máu đợt này.';
              const recipientUserId = (donorUser?._id || donorProfile?.userId || appointment.donorId).toString();

              await emitEligibilityCheckFailed({
                donorId: recipientUserId,
                donorName,
                campaignName,
                appointmentDate: appDateStr,
                reason,
                deepLink: '/profile',
                audienceRole: 'Donor',
              });
            }
          } catch (nErr) {
            console.error('Error processing rejected notification logic:', nErr);
          }
        }

        // Auto stock-in blood bag if testResult is 'Pass'
        if (targetAppointmentStatus === AppointmentStatus.Completed && payload.testResult === 'Pass') {
          const expiryDate = new Date(appointment.appointmentDate);
          expiryDate.setDate(expiryDate.getDate() + 35); // 35 days shelf life for whole blood
          
          const donorProf = await DonorProfile.findOne({
            $or: [{ userId: appointment.donorId }, { _id: appointment.donorId }]
          }, null, opts).lean();

          const bType = payload.bloodType || donorProf?.bloodType || 'Unknown';
          
          if (bType && bType !== 'Unknown' && bType !== 'Chưa biết' && bType !== '?') {
            const bagCode = `BB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
            const newBag = new BloodBag({
              bagCode,
              bloodType: bType,
              volumeMl: payload.donationVolume || (appointment as any).donationVolume || 350,
              collectionDate: appointment.appointmentDate,
              expiryDate,
              storageLocation: 'Kho chính - Khu vực chờ phân loại',
              status: 'Available',
              donorSourceId: appointment.donorId,
              campaignSourceId: appointment.campaignId,
              testResult: 'Pass',
              statusHistory: [{
                previousStatus: 'None',
                newStatus: 'Available',
                changedBy: actorUserId,
                reason: 'Hệ thống tự động nhập kho từ lượt hiến máu hoàn tất'
              }]
            });
            await newBag.save(opts);
          }
        }

        // Process Gamification (+50 XP bonus) when donor starts Examining phase (changed from CheckedIn)
        if (targetAppointmentStatus === AppointmentStatus.Examining && !appointment.xpRewardedForExamining) {
          try {
            await GamificationService.processCheckInBonus(appointment.donorId);
          } catch (gErr) {
            console.error('Error processing examining gamification logic:', gErr);
          }
        }
      }

      if (payload.donationVolume !== undefined) {
        (appointment as any).donationVolume = Number(payload.donationVolume) || 350;
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
          : (payload.status === 'Examining') ? 'Examining'
          : (payload.status === 'CheckedIn') ? 'CheckedIn'
          : 'Pending'
        : digitalRecord?.donationStatus || 'Pending';

      if (!digitalRecord) {
        digitalRecord = new DigitalDonorRecord({
          appointmentId: registrationId,
          donorId: appointment.donorId,
          screeningSummary: { staffVitals: payload.vitals || null, ...(payload.donationVolume ? { donationVolume: payload.donationVolume } : {}) },
          donationStatus: mongoDonationStatus,
          clinicalNotes: payload.screeningNotes || '',
          lastUpdatedAt: new Date()
        });
      } else {
        const existingSummary = (digitalRecord.screeningSummary as Record<string, any>) || {};
        digitalRecord.screeningSummary = {
          ...existingSummary,
          ...(payload.vitals ? { staffVitals: payload.vitals } : {}),
          ...(payload.donationVolume ? { donationVolume: payload.donationVolume } : {})
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

    // Execute screening update
    await executeUpdate();

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
  static async checkInByQRCode(qrPayload: string, actorUserId?: string, targetCampaignId?: string) {
    const cleanPayload = qrPayload ? qrPayload.trim() : '';
    if (!cleanPayload) {
      const err: any = new Error('Vui lòng cung cấp mã QR hoặc mã vé E-Ticket hợp lệ');
      err.statusCode = 400;
      throw err;
    }

    let appointment: any = null;
    let foundETicket: any = null;

    // 1. Try finding ETicket by ticketCode or qrPayloadSigned or stripped prefix
    const eTicket = await ETicket.findOne({
      $or: [
        { ticketCode: cleanPayload },
        { qrPayloadSigned: cleanPayload },
        { ticketCode: cleanPayload.replace('SIGNED-', '') }
      ]
    }).lean();

    if (eTicket) {
      foundETicket = eTicket;
      appointment = await Appointment.findById(eTicket.appointmentId);
    }

    // 2. Try finding by CCCD (idDocumentNumber) in DonorProfile or User
    if (!appointment) {
      let cccdNumber = cleanPayload;
      if (cleanPayload.includes('|')) {
        const parts = cleanPayload.split('|');
        if (parts[0] && /^\d{9,12}$/.test(parts[0].trim())) {
          cccdNumber = parts[0].trim();
        }
      }

      const matchingProfile = await DonorProfile.findOne({ idDocumentNumber: cccdNumber }).lean();
      const matchingUser = await User.findOne({ idDocumentNumber: cccdNumber }).lean();

      const donorUserIds = [
        ...(matchingProfile ? [matchingProfile.userId, matchingProfile._id] : []),
        ...(matchingUser ? [matchingUser._id] : [])
      ].filter(Boolean);

      if (donorUserIds.length > 0) {
        const queryFilter: any = {
          donorId: { $in: donorUserIds }
        };
        if (targetCampaignId && targetCampaignId !== 'all' && mongoose.Types.ObjectId.isValid(targetCampaignId)) {
          queryFilter.campaignId = new mongoose.Types.ObjectId(targetCampaignId);
        }
        appointment = await Appointment.findOne(queryFilter).sort({ appointmentDate: -1, createdAt: -1 });
      }
    }

    // 3. Try finding Appointment directly by _id
    if (!appointment && mongoose.Types.ObjectId.isValid(cleanPayload)) {
      appointment = await Appointment.findById(cleanPayload);
    }

    // Strict validation: Do NOT fallback to random appointments!
    if (!appointment) {
      const err: any = new Error('Không tìm thấy phiếu đăng ký hoặc mã vé hợp lệ.');
      err.statusCode = 404;
      throw err;
    }

    // 4. Validate Campaign Scoping FIRST
    if (targetCampaignId && targetCampaignId !== 'all' && mongoose.Types.ObjectId.isValid(targetCampaignId)) {
      const campaignIdFromApp = appointment.campaignId ? appointment.campaignId.toString() : '';
      if (campaignIdFromApp !== targetCampaignId.toString()) {
        const err: any = new Error('Vé thuộc chiến dịch khác.');
        err.statusCode = 400;
        throw err;
      }
    }

    // 5. Validate Campaign Status AFTER confirming it is the correct campaign
    if (appointment.campaignId) {
      const campaign = await Campaign.findById(appointment.campaignId);
      if (campaign && campaign.status !== 'Active') {
        const registrationDetails = await RegistrationService.getRegistrationById(appointment._id.toString());
        return {
          ...registrationDetails,
          warning: 'Chiến dịch chưa diễn ra (chưa mở).',
          isCampaignNotActive: true
        };
      }
    }

    // 5. Check if ETicket is explicitly invalidated
    if (foundETicket && (foundETicket.qrPayloadSigned === 'INVALIDATED' || foundETicket.qrPayloadSigned === 'EXPIRED')) {
      const err: any = new Error('Mã vé đã bị hủy hoặc đã hết hạn.');
      err.statusCode = 400;
      throw err;
    }

    // 6. Check Appointment status & DigitalDonorRecord status
    const registrationIdStr = appointment._id.toString();
    const digitalRecord = await DigitalDonorRecord.findOne({ appointmentId: appointment._id }).lean();
    const effectiveStatus: string = digitalRecord?.donationStatus || appointment.status;

    if (
      effectiveStatus === 'Cancelled' ||
      effectiveStatus === (AppointmentStatus.Cancelled as string) ||
      appointment.status === AppointmentStatus.Cancelled ||
      appointment.status === 'Cancelled'
    ) {
      const err: any = new Error('Phiếu đăng ký đã bị hủy.');
      err.statusCode = 400;
      throw err;
    }

    if (
      effectiveStatus === 'Rejected' ||
      effectiveStatus === (AppointmentStatus.Rejected as string) ||
      appointment.status === AppointmentStatus.Rejected ||
      appointment.status === 'Rejected'
    ) {
      const err: any = new Error('Phiếu đăng ký đã bị từ chối.');
      err.statusCode = 400;
      throw err;
    }

    if (
      effectiveStatus === 'Completed' ||
      effectiveStatus === 'Donation Completed' ||
      effectiveStatus === (AppointmentStatus.Completed as string) ||
      appointment.status === AppointmentStatus.Completed ||
      appointment.status === 'Completed'
    ) {
      const err: any = new Error('Người hiến máu đã hoàn thành hiến máu.');
      err.statusCode = 400;
      throw err;
    }

    // 7. Update status to CheckedIn ONLY IF registration is in Confirmed / Pending / Scheduled status
    if (
      effectiveStatus === 'Confirmed' ||
      effectiveStatus === 'Pending' ||
      effectiveStatus === 'Scheduled' ||
      effectiveStatus === (AppointmentStatus.Confirmed as string) ||
      effectiveStatus === (AppointmentStatus.Pending as string)
    ) {
      return await RegistrationService.updateRegistrationScreening(
        registrationIdStr,
        { status: 'CheckedIn' },
        actorUserId || 'system'
      );
    }

    // If already CheckedIn / Examining / Eligible, return current registration details
    return await RegistrationService.getRegistrationById(registrationIdStr);
  }
}
