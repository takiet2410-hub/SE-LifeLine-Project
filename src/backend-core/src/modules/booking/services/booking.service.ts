import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { uploadImageToCloudinary } from '../../../utils/cloudinary.util';
import { Appointment, AppointmentStatus } from '../models/appointment.model';
import { ScreeningForm } from '../models/screening-form.model';
import { ScreeningFormTemplate } from '../models/screening-form-template.model';
import { ETicket } from '../models/eticket.model';
import { User } from '../../auth-account/models/user.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { DigitalDonorRecord } from '../../registration/models/digital-donor-record.model';
import { sendBookingConfirmationEmail, sendBookingRejectionEmail } from '../../../utils/email.util';
import { Campaign } from '../../campaign/models/campaign.model';
import { notificationEvents, emitAppointmentConfirmed } from '../../notification/services/notification.events';
import { Hospital } from '../../auth-account/models/hospital.model';
import { BloodCenter } from '../../auth-account/models/blood-center.model';

export class BookingService {
  public static async searchLocations(filters: any) {
    // Query both Active & Upcoming campaigns (exclude Cancelled and Draft)
    let query: any = { status: { $nin: ['Cancelled', 'Draft'] } };

    if (filters.lat !== undefined && filters.lng !== undefined) {
      const radiusInMeters = (filters.radius || 15) * 1000;
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [filters.lng, filters.lat]
          },
          $maxDistance: radiusInMeters
        }
      };
    }

    if (filters.date) {
      const dateParts = String(filters.date).split('-').map(Number);
      if (dateParts.length === 3 && !dateParts.some(isNaN)) {
        const [year, month, day] = dateParts;
        const startOfDay = new Date(`${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+07:00`);
        const endOfDay = new Date(`${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59.999+07:00`);

        query.startDateTime = { $lte: endOfDay };
        query.endDateTime = { $gte: startOfDay };
      } else {
        const targetDate = new Date(filters.date);
        if (!isNaN(targetDate.getTime())) {
          // Format the parsed date to local timezone string before bounding
          const yyyy = targetDate.getFullYear();
          const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
          const dd = String(targetDate.getDate()).padStart(2, '0');
          const startOfDay = new Date(`${yyyy}-${mm}-${dd}T00:00:00+07:00`);
          const endOfDay = new Date(`${yyyy}-${mm}-${dd}T23:59:59.999+07:00`);
          query.startDateTime = { $lte: endOfDay };
          query.endDateTime = { $gte: startOfDay };
        }
      }
    }

    let campaigns: any[] = await Campaign.find(query).lean();

    // Dynamically calculate real-time status (Active, Upcoming, Completed)
    const now = new Date();
    campaigns = campaigns.map(c => {
      if (c.status === 'Cancelled' || c.status === 'Draft') return c;
      const start = new Date(c.startDateTime);
      const end = new Date(c.endDateTime);
      let calculatedStatus = c.status;
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (now >= start && now <= end) {
          calculatedStatus = 'Active';
        } else if (now < start) {
          calculatedStatus = 'Upcoming';
        } else if (now > end) {
          calculatedStatus = 'Completed';
        }
      }
      return {
        ...c,
        status: calculatedStatus
      };
    }).filter(c => c.status === 'Active' || c.status === 'Upcoming');

    // Exclude campaigns whose working hours on today have already ended (and have no future dates)
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    campaigns = campaigns.filter(c => {
      const end = new Date(c.endDateTime);
      // If the entire campaign ended before now
      if (end < now) return false;

      // If campaign ends today, check if timeslots / working hours today have all passed
      const endYMD = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      if (endYMD === todayYMD) {
        // If timeslots exist, check the latest endTime
        const slots = (c.dailyTimeslots && c.dailyTimeslots.length > 0)
          ? c.dailyTimeslots.filter((s: any) => s.dateStr === todayYMD)
          : (c.timeslots || []);
          
        if (slots.length > 0) {
          const latestEndTime = slots.reduce((latest: string, slot: any) => {
            const slotEnd = slot.endTime || '00:00';
            return slotEnd > latest ? slotEnd : latest;
          }, '00:00');
          if (latestEndTime && latestEndTime !== '00:00' && currentTimeStr >= latestEndTime) {
            return false; // working hours ended today!
          }
        }
      }
      return true;
    });

    // Filter by blood type (supporting multi-select and matching spots accepting all blood types)
    if (filters.bloodType) {
      const selectedTypes = (typeof filters.bloodType === 'string' ? filters.bloodType.split(',') : [filters.bloodType])
        .map((t: string) => t.trim().toUpperCase())
        .filter(Boolean);

      const isAllSelected = selectedTypes.length === 0 || selectedTypes.length >= 8 || selectedTypes.includes('ALL');

      if (!isAllSelected && selectedTypes.length > 0) {
        campaigns = campaigns.filter(c => {
          const bgUpper = (c.targetBloodGroups || []).map((g: string) => String(g).trim().toUpperCase());
          // Spot accepts all blood types if empty/undefined, contains 'ALL', 'TẤT CẢ', 'MỌI', 'EVERYONE', has >= 8 blood types, or covers all 4 main groups
          const acceptsAll =
            bgUpper.length === 0 ||
            bgUpper.length >= 8 ||
            bgUpper.some((g: string) => g === 'ALL TYPES' || g.includes('TẤT CẢ') || g.includes('MỌI') || g.includes('EVERYONE')) ||
            (bgUpper.some((g: string) => g.startsWith('A')) &&
             bgUpper.some((g: string) => g.startsWith('B')) &&
             bgUpper.some((g: string) => g.startsWith('O')) &&
             bgUpper.some((g: string) => g.startsWith('AB')));

          if (acceptsAll) return true;
          return selectedTypes.some((st: string) => bgUpper.includes(st));
        });
      }
    }

    if (filters.crowdingLevel) {
      campaigns = campaigns.filter(c => {
        if (!c.capacity) return true;
        const ratio = (c.registeredCount || 0) / c.capacity;
        if (filters.crowdingLevel === 'Low') return ratio < 0.5;
        if (filters.crowdingLevel === 'Medium' || filters.crowdingLevel === 'Moderate') return ratio >= 0.5 && ratio < 0.8;
        if (filters.crowdingLevel === 'High') return ratio >= 0.8;
        return true;
      });
    }

    if (!filters.includeFacilities) return campaigns;

    const facilityLocationQuery = filters.lat !== undefined && filters.lng !== undefined
      ? {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [filters.lng, filters.lat]
            },
            $maxDistance: (filters.radius || 15) * 1000
          }
        }
      : { $exists: true };

    const [hospitals, bloodCenters] = await Promise.all([
      Hospital.find({
        $and: [
          { $or: [{ isVerified: true }, { isVerified: { $exists: false } }] },
          { name: { $not: /(mock data|test)/i } },
          { location: facilityLocationQuery }
        ]
      }).lean(),
      BloodCenter.find({
        $and: [
          { name: { $not: /(mock data|test)/i } },
          { location: facilityLocationQuery }
        ]
      }).lean()
    ]);

    const facilities = [
      ...hospitals.map((hospital: any) => ({
        _id: `hospital:${hospital._id}`,
        facilityId: hospital._id,
        entityType: 'Hospital',
        isBookable: false,
        name: hospital.name,
        venue: hospital.name,
        fullAddress: hospital.address,
        location: hospital.location,
        contactPhone: hospital.contactPhone,
        operatingHours: 'Liên hệ cơ sở để biết giờ tiếp nhận',
        status: 'Facility',
        targetBloodGroups: [],
        timeslots: []
      })),
      ...bloodCenters.map((center: any) => ({
        _id: `blood-center:${center._id}`,
        facilityId: center._id,
        entityType: 'BloodCenter',
        isBookable: false,
        name: center.name,
        venue: center.name,
        fullAddress: center.address,
        location: center.location,
        contactPhone: center.contactPhone,
        operatingHours: center.operatingHours,
        status: 'Facility',
        targetBloodGroups: [],
        timeslots: []
      }))
    ];

    return [
      ...facilities,
      ...campaigns.map((campaign: any) => ({
        ...campaign,
        entityType: 'Campaign',
        isBookable: true
      }))
    ];
  }
  public static async createAppointment(donorId: string, data: any) {
    const { campaignId, appointmentDate, timeSlot, answers } = data;

    // Ensure index builds are completed before starting transaction
    await Promise.all([
      Appointment.init(),
      ScreeningForm.init(),
      ETicket.init(),
      Campaign.init()
    ]);

    // Ensure collections exist before starting transaction to avoid "catalog changes" error
    await Promise.all([
      Campaign.createCollection().catch(() => {}),
      Appointment.createCollection().catch(() => {}),
      ScreeningForm.createCollection().catch(() => {}),
      ETicket.createCollection().catch(() => {})
    ]);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate Campaign
      const campaign = await Campaign.findById(campaignId).session(session);
      if (!campaign) {
        throw new Error('NOT_FOUND_CAMPAIGN');
      }
      if (campaign.status !== 'Active' && campaign.status !== 'Upcoming') {
        throw new Error('CAMPAIGN_NOT_ACTIVE');
      }
      if (campaign.registeredCount >= campaign.capacity) {
        throw new Error('CAMPAIGN_FULL');
      }

      // 2. Validate donation interval eligibility (Configurable by Admin in SystemConfig)
      let donationIntervalDays = 84;
      try {
        const { SystemConfig } = await import('../../admin/models/system-config.model');
        const config = await SystemConfig.findOne({ key: 'donationIntervalDays' }).lean();
        if (config && typeof config.value === 'number') {
          donationIntervalDays = config.value;
        }
      } catch (e) {}

      const lastCompleted = await Appointment.findOne({ donorId, status: AppointmentStatus.Completed }).sort({ appointmentDate: -1 });
      const donorProfile = await DonorProfile.findOne({ userId: donorId });

      let lastDonationDate: Date | null = null;
      const completedDate = lastCompleted?.appointmentDate ? new Date(lastCompleted.appointmentDate) : null;
      const profileDate = donorProfile?.lastDonationDate ? new Date(donorProfile.lastDonationDate) : null;

      if (completedDate && profileDate) {
        lastDonationDate = completedDate > profileDate ? completedDate : profileDate;
      } else {
        lastDonationDate = completedDate || profileDate || null;
      }

      if (lastDonationDate) {
        const nextEligibleDate = new Date(lastDonationDate.getTime() + donationIntervalDays * 24 * 60 * 60 * 1000);
        const targetDate = new Date(appointmentDate);
        
        if (targetDate < nextEligibleDate) {
          const err: any = new Error('ELIGIBILITY_FAILED_84_DAYS');
          err.code = 'ELIGIBILITY_FAILED_INTERVAL';
          err.donationIntervalDays = donationIntervalDays;
          err.lastDonationDate = lastDonationDate.toISOString();
          err.nextEligibleDate = nextEligibleDate.toISOString();
          throw err;
        }
      }

      // 3. Prevent Duplicate Appointments (overlapping dates)
      const existing = await Appointment.findOne({ donorId, status: { $in: [AppointmentStatus.Pending, AppointmentStatus.Confirmed, AppointmentStatus.Scheduled, AppointmentStatus.CheckedIn] } });
      if (existing) {
        throw new Error('DUPLICATE_APPOINTMENT');
      }

      // 4. Validate Screening Form
      let outcome = 'PASS';
      let usedTemplateId = undefined;
      
      if (!answers || !Array.isArray(answers.responses)) {
        throw new Error('INVALID_SCREENING_FORM');
      }

      const activeTemplate = await ScreeningFormTemplate.findOne({ isActive: true }).session(session);
      
      if (activeTemplate) {
        usedTemplateId = activeTemplate._id;
        for (const response of answers.responses) {
          const questionDef = activeTemplate.questions.find((q: any) => 
            q.questionId === response.questionId || q.questionId === `Q${response.questionId}`
          );
          if (!questionDef) continue;
          
          for (const option of response.selectedOptions) {
            const optionDef = questionDef.options.find((o: any) => 
              o.label === option || 
              o.optionId === option || 
              option.startsWith(o.label)
            );
            if (optionDef) {
              if (optionDef.outcomeFlag === 'REJECT') {
                outcome = 'REJECT';
              } else if (optionDef.outcomeFlag === 'REVIEW' && outcome !== 'REJECT') {
                outcome = 'REVIEW';
              }
            }
          }
          if (outcome === 'REJECT') break;
        }
      } else {
        // Fallback to hardcoded logic if no template seeded yet
        const rejectOptions = [
          'Viêm gan siêu vi B', 'Viêm gan siêu vi C', 'HIV', 'Vảy nến', 'Phì đại tiền liệt tuyến',
          'Sốc phản vệ', 'Tai biến mạch máu não', 'Nhồi máu cơ tim', 'Lupus ban đỏ',
          'Động kinh', 'Ung thư', 'Hen', 'Được cấy ghép mô tạng',
          'Khỏi bệnh sau khi mắc một trong các bệnh: sốt rét, giang mai, lao, viêm não - màng não, uốn ván',
          'Phẫu thuật ngoại khoa', 'Được truyền máu hoặc các chế phẩm máu',
          'Khỏi bệnh sau khi mắc một trong các bệnh: thương hàn, nhiễm trùng máu, bị rắn cắn, viêm tắc động mạch, viêm tắc tĩnh mạch, viêm tụy, viêm tủy xương',
          'Sút cân nhanh không rõ nguyên nhân', 'Nổi hạch kéo dài',
          'Thực hiện thủ thuật y tế xâm lấn (chữa răng, châm cứu, lăn kim, nội soi,...)',
          'Xăm, xỏ lỗ tai, lỗ mũi hoặc các vị trí khác trên cơ thể', 'Sử dụng ma túy',
          'Tiếp xúc trực tiếp với máu, dịch tiết của người khác hoặc bị thương bởi kim tiêm',
          'Sinh sống chung với người nhiễm viêm gan siêu vi B',
          'Quan hệ tình dục với người nhiễm viêm gan siêu vi B, C, HIV, giang mai hoặc người có nguy cơ nhiễm',
          'Quan hệ tình dục với người cùng giới',
          'Khỏi bệnh sau khi mắc bệnh viêm đường tiết niệu, viêm da nhiễm trùng, viêm phế quản, viêm phổi, sởi, ho gà, quai bị, sốt xuất huyết, kiết lỵ, tả, Rubella',
          'Đi vào vùng có dịch bệnh lưu hành (sốt rét, sốt xuất huyết, Zika,...)',
          'Bị cúm, cảm lạnh, ho, nhức đầu, sốt, đau họng',
          'Dùng thuốc kháng sinh, kháng viêm, Aspirin, Corticoid'
        ];
        
        const reviewOptions = [
          'Có (nhập mô tả)', 'Bệnh khác (nhập mô tả)', 'Tiêm vắc xin (nhập tên vắc xin)', 'Khác (nhập mô tả)'
        ];

        for (const response of answers.responses) {
          for (const option of response.selectedOptions) {
            if (option === 'Không') continue;
            if (option === 'Có' && response.questionId === '1') continue;

            if (rejectOptions.includes(option)) {
              outcome = 'REJECT';
              break;
            }

            if (reviewOptions.includes(option) || response.description) {
              if (outcome !== 'REJECT') outcome = 'REVIEW';
            }
          }
          if (outcome === 'REJECT') break;
        }
      }

      if (outcome === 'REJECT') {
        throw new Error('ELIGIBILITY_FAILED_SCREENING');
      }

      const newAppointmentId = new mongoose.Types.ObjectId();

      // 5. Create ScreeningForm
      const newScreening = new ScreeningForm({
        appointmentId: newAppointmentId,
        templateId: usedTemplateId,
        responses: answers.responses,
        outcome
      });
      await newScreening.save({ session });

      // 6. Create Appointment in Pending status without eTicket
      const newAppointment = new Appointment({
        _id: newAppointmentId,
        donorId,
        campaignId,
        appointmentDate,
        timeSlot,
        status: AppointmentStatus.Pending,
        screeningFormId: newScreening._id
      });
      await newAppointment.save({ session });

      // 7. Create initial DigitalDonorRecord with Pending status
      const newDigitalRecord = new DigitalDonorRecord({
        appointmentId: newAppointmentId,
        donorId: new mongoose.Types.ObjectId(donorId),
        donationStatus: 'Pending',
        screeningSummary: {
          donorSubmitted: {
            medicalHistory: answers?.medicalHistory || {},
            currentHealthStatus: answers?.currentHealthStatus || 'Healthy',
            recentTravel: answers?.recentTravel || 'None',
            medicationHistory: answers?.medicationHistory || 'None',
            consentGiven: answers?.consentGiven || true,
            eligibilityFlag: outcome === 'PASS' ? 'Eligible' : 'RequiresReview'
          }
        },
        clinicalNotes: '',
        lastUpdatedAt: new Date()
      });
      await newDigitalRecord.save({ session });

      // 8. Update Campaign total capacity and specific timeslot registeredCount
      campaign.registeredCount = Math.max(0, (campaign.registeredCount || 0) + 1);

      const slotStartTime = String(timeSlot || '').split('-')[0].trim();
      let slotFound = false;

      const targetDateStr = typeof appointmentDate === 'string'
        ? appointmentDate.split('T')[0]
        : (appointmentDate as any) instanceof Date
        ? (appointmentDate as Date).toISOString().split('T')[0]
        : String(appointmentDate).split('T')[0];

      if (campaign.dailyTimeslots && campaign.dailyTimeslots.length > 0) {
        const targetDaily = campaign.dailyTimeslots.find(
          (dt: any) => (dt.dateStr === targetDateStr || dt.dateStr === appointmentDate) && dt.startTime === slotStartTime
        );
        if (targetDaily) {
          targetDaily.registeredCount = Math.max(0, (targetDaily.registeredCount || 0) + 1);
          slotFound = true;
        }
      }

      if (!slotFound && campaign.timeslots && campaign.timeslots.length > 0) {
        const targetPattern = campaign.timeslots.find(
          (s: any) => s.startTime === slotStartTime
        );
        if (targetPattern) {
          targetPattern.registeredCount = Math.max(0, (targetPattern.registeredCount || 0) + 1);
        }
      }

      await campaign.save({ session });

      await session.commitTransaction();
      session.endSession();

      return await Appointment.findById(newAppointmentId).populate('screeningFormId').lean();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  public static async confirmAppointmentByBloodCenter(id: string, donorId?: string) {
    await Promise.all([
      Appointment.init(),
      ETicket.init(),
      DigitalDonorRecord.init()
    ]);

    await Promise.all([
      Appointment.createCollection().catch(() => {}),
      ETicket.createCollection().catch(() => {}),
      DigitalDonorRecord.createCollection().catch(() => {})
    ]);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const query: any = { _id: id };
      if (donorId) query.donorId = donorId;

      const appointment = await Appointment.findOne(query).session(session);
      if (!appointment) {
        throw new Error('APPOINTMENT_NOT_FOUND');
      }

      if (appointment.status === AppointmentStatus.Cancelled || appointment.status === AppointmentStatus.NoShow) {
        throw new Error('INVALID_STATUS_TRANSITION');
      }

      // Generate E-Ticket if not already present
      let eTicketId = appointment.eTicketId;
      if (!eTicketId) {
        const ticketCode = `TK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const qrPayloadSigned = `SIGNED-${ticketCode}`;
        
        let fileUrl = undefined;
        try {
          const qrBuffer = await QRCode.toBuffer(qrPayloadSigned);
          fileUrl = await uploadImageToCloudinary(qrBuffer, 'etickets');
        } catch (error) {
          console.error('Failed to generate or upload QR Code:', error);
        }
        if (!fileUrl) {
          fileUrl = `https://res.cloudinary.com/lifeline/etickets/${ticketCode}.png`;
        }

        const newETicket = new ETicket({
          appointmentId: appointment._id,
          ticketCode,
          qrPayloadSigned,
          fileUrl,
          issuedAt: new Date()
        });
        await newETicket.save({ session });
        eTicketId = newETicket._id as mongoose.Types.ObjectId;
      }

      appointment.status = AppointmentStatus.Confirmed;
      appointment.eTicketId = eTicketId;
      await appointment.save({ session });

      await DigitalDonorRecord.updateOne(
        { appointmentId: appointment._id },
        { $set: { donationStatus: 'Confirmed', lastUpdatedAt: new Date() } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      const fullAppointment: any = await Appointment.findById(id).populate('eTicketId').populate('campaignId').lean();

      // Trigger Email Notification with attached E-ticket asynchronously
      try {
        if (fullAppointment) {
          let donorUser: any = await User.findById(fullAppointment.donorId).lean();
          let donorProfile: any = await DonorProfile.findOne({
            $or: [
              { userId: fullAppointment.donorId },
              { _id: fullAppointment.donorId }
            ]
          }).lean();

          if (!donorUser && donorProfile?.userId) {
            donorUser = await User.findById(donorProfile.userId).lean();
          }

          const rawEmail = donorUser?.email || donorProfile?.email || '';
          const recipientEmail = (rawEmail && typeof rawEmail === 'string' && rawEmail.includes('@')) ? rawEmail.trim() : null;

          if (recipientEmail && fullAppointment.eTicketId) {
            const eTicket: any = fullAppointment.eTicketId;
            const campaign: any = fullAppointment.campaignId;
            const rawCampaignName = campaign?.name;
            const campaignName = (rawCampaignName && typeof rawCampaignName === 'string' && rawCampaignName.trim())
              ? rawCampaignName.trim()
              : 'Trung tâm tiếp nhận máu LifeLine';
            sendBookingConfirmationEmail(
              recipientEmail,
              donorProfile?.fullName || donorUser?.fullName || 'Người hiến máu',
              campaignName,
              fullAppointment.appointmentDate,
              fullAppointment.timeSlot,
              eTicket.ticketCode || '',
              eTicket.fileUrl || ''
            ).catch(err => console.error('Failed to send confirmation email:', err));
          } else {
            console.log(`[BookingService] Skipping email notification - No valid email for donorId: ${fullAppointment.donorId}`);
          }
        }
      } catch (emailErr) {
        console.error('Error fetching details for confirmation email:', emailErr);
      }

      return fullAppointment;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  public static async decrementCampaignSlot(campaignId: any, appointmentDate: string, timeSlot: string, session?: mongoose.ClientSession) {
    if (!campaignId) return;
    const query = Campaign.findById(campaignId);
    const campaign = session ? await query.session(session) : await query;
    if (!campaign) return;

    campaign.registeredCount = Math.max(0, (campaign.registeredCount || 0) - 1);

    const slotStartTime = String(timeSlot || '').split('-')[0].trim();
    let slotFound = false;

    const targetDateStr = typeof appointmentDate === 'string'
      ? appointmentDate.split('T')[0]
      : (appointmentDate as any) instanceof Date
      ? (appointmentDate as Date).toISOString().split('T')[0]
      : String(appointmentDate).split('T')[0];

    if (campaign.dailyTimeslots && campaign.dailyTimeslots.length > 0) {
      const targetDaily = campaign.dailyTimeslots.find(
        (dt: any) => (dt.dateStr === targetDateStr || dt.dateStr === appointmentDate) && dt.startTime === slotStartTime
      );
      if (targetDaily) {
        targetDaily.registeredCount = Math.max(0, (targetDaily.registeredCount || 0) - 1);
        slotFound = true;
      }
    }

    if (!slotFound && campaign.timeslots && campaign.timeslots.length > 0) {
      const targetPattern = campaign.timeslots.find(
        (s: any) => s.startTime === slotStartTime
      );
      if (targetPattern) {
        targetPattern.registeredCount = Math.max(0, (targetPattern.registeredCount || 0) - 1);
      }
    }

    if (session) {
      await campaign.save({ session });
    } else {
      await campaign.save();
    }
  }

  public static async rejectAppointmentByBloodCenter(id: string, reason?: string) {
    const appointment = await Appointment.findById(id).populate('campaignId');
    if (!appointment) {
      throw new Error('APPOINTMENT_NOT_FOUND');
    }

    if (appointment.status !== AppointmentStatus.Rejected && 
        appointment.status !== AppointmentStatus.Cancelled && 
        appointment.status !== AppointmentStatus.Examining) {
      if (appointment.campaignId && appointment.appointmentDate) {
        const cId = typeof appointment.campaignId === 'object' ? (appointment.campaignId as any)._id : appointment.campaignId;
        await BookingService.decrementCampaignSlot(cId, appointment.appointmentDate.toISOString(), appointment.timeSlot || '');
      }
    }

    appointment.status = AppointmentStatus.Rejected;
    await appointment.save();

    const campaign: any = appointment.campaignId;

    try {
      let donorUser: any = await User.findById(appointment.donorId).lean();
      let donorProfile: any = await DonorProfile.findOne({
        $or: [
          { userId: appointment.donorId },
          { _id: appointment.donorId }
        ]
      }).lean();

      if (!donorUser && donorProfile?.userId) {
        donorUser = await User.findById(donorProfile.userId).lean();
      }

      const rawEmail = donorUser?.email || donorProfile?.email || '';
      const recipientEmail = (rawEmail && typeof rawEmail === 'string' && rawEmail.includes('@')) ? rawEmail.trim() : null;

      if (recipientEmail) {
        const donorName = donorProfile?.fullName || donorUser?.fullName || 'Người hiến máu';
        const campaignName = (campaign?.name && typeof campaign.name === 'string' && campaign.name.trim())
          ? campaign.name.trim()
          : 'Trung tâm tiếp nhận máu LifeLine';
        const appDate = appointment.appointmentDate;
        await sendBookingRejectionEmail(recipientEmail, donorName, campaignName, appDate, reason)
          .catch(err => console.error('Failed to send rejection email:', err));
      } else {
        console.log(`[BookingService] Skipping rejection email - No valid email for donorId: ${appointment.donorId}`);
      }
    } catch (err) {
      console.error('Error sending rejection email:', err);
    }

    return appointment;
  }

  private static async checkAndMarkExpiredAppointments(appointments: any[]) {
    if (!Array.isArray(appointments) || appointments.length === 0) return;
    const now = new Date();

    for (const app of appointments) {
      if (!app || !app.appointmentDate) continue;
      if (
        app.status === AppointmentStatus.Pending ||
        app.status === AppointmentStatus.Confirmed ||
        app.status === AppointmentStatus.Scheduled
      ) {
        const endTime = new Date(app.appointmentDate);
        let endHour = 23;
        let endMinute = 59;

        if (app.timeSlot) {
          const parts = app.timeSlot.split('-');
          if (parts.length > 1) {
            const [h, m] = parts[1].trim().split(':').map(Number);
            if (!isNaN(h)) endHour = h;
            if (!isNaN(m)) endMinute = m;
          } else if (parts.length === 1) {
            const [h, m] = parts[0].trim().split(':').map(Number);
            if (!isNaN(h)) endHour = h + 2;
            if (!isNaN(m)) endMinute = m;
          }
        }

        endTime.setHours(endHour, endMinute, 59, 999);

        if (now > endTime) {
          app.status = AppointmentStatus.NoShow;
          await Appointment.updateOne(
            { _id: app._id },
            { $set: { status: AppointmentStatus.NoShow } }
          );

          if (app.eTicketId) {
            const ticketId = typeof app.eTicketId === 'object' ? app.eTicketId._id : app.eTicketId;
            if (ticketId) {
              await ETicket.updateOne(
                { _id: ticketId },
                { $set: { qrPayloadSigned: 'EXPIRED' } }
              );
            }
          }
        }
      }
    }
  }

  public static async getAppointmentById(id: string, donorId: string) {
    const appointment = await Appointment.findOne({ _id: id, donorId })
      .populate('screeningFormId')
      .populate('eTicketId')
      .populate('campaignId')
      .lean();
    if (!appointment) {
      throw new Error('APPOINTMENT_NOT_FOUND');
    }
    await this.checkAndMarkExpiredAppointments([appointment]);
    return appointment;
  }

  public static async listAppointments(donorId: string) {
    const appointments = await Appointment.find({ donorId })
      .populate('campaignId')
      .populate('eTicketId')
      .populate('screeningFormId')
      .sort({ appointmentDate: -1 })
      .lean();
    await this.checkAndMarkExpiredAppointments(appointments);
    return appointments;
  }

  public static async cancelAppointment(id: string, donorId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const appointment = await Appointment.findOne({ _id: id, donorId }).session(session);

      if (!appointment) {
        throw new Error('APPOINTMENT_NOT_FOUND');
      }

      if (appointment.status === AppointmentStatus.Cancelled || appointment.status === AppointmentStatus.Completed || appointment.status === AppointmentStatus.NoShow) {
        throw new Error('INVALID_STATUS_TRANSITION');
      }

      const now = new Date();
      
      // Calculate exact appointment time using timeSlot safely
      const exactAppointmentTime = new Date(appointment.appointmentDate);
      if (appointment.timeSlot) {
        const [startHour, startMinute] = appointment.timeSlot.split('-')[0].split(':').map(Number);
        exactAppointmentTime.setHours(startHour || 0, startMinute || 0, 0, 0);
      }
      
      const diffTime = exactAppointmentTime.getTime() - now.getTime();
      const diffHours = diffTime / (1000 * 60 * 60);
      
      // Allow a 30-minute grace period if they JUST booked it and made a mistake
      const createdDiffMinutes = appointment.createdAt 
        ? (now.getTime() - appointment.createdAt.getTime()) / (1000 * 60)
        : 999; // If no createdAt, assume it's an old appointment

      // deadline is 24 hours prior
      if (diffHours < 24 && createdDiffMinutes > 30) {
        throw new Error('CANCELLATION_DEADLINE_PASSED');
      }

      appointment.status = AppointmentStatus.Cancelled;
      await appointment.save({ session });

      const campaign = await Campaign.findById(appointment.campaignId).session(session);
      if (campaign) {
        campaign.registeredCount = Math.max(0, (campaign.registeredCount || 0) - 1);

        const slotStartTime = String(appointment.timeSlot || '').split('-')[0].trim();
        let slotFound = false;

        const appDateStr = appointment.appointmentDate instanceof Date 
          ? appointment.appointmentDate.toISOString().split('T')[0] 
          : String(appointment.appointmentDate).split('T')[0];

        if (campaign.dailyTimeslots && campaign.dailyTimeslots.length > 0) {
          const targetDaily = campaign.dailyTimeslots.find(
            (dt: any) => dt.dateStr === appDateStr && dt.startTime === slotStartTime
          );
          if (targetDaily) {
            targetDaily.registeredCount = Math.max(0, (targetDaily.registeredCount || 0) - 1);
            slotFound = true;
          }
        }

        if (!slotFound && campaign.timeslots && campaign.timeslots.length > 0) {
          const targetPattern = campaign.timeslots.find(
            (s: any) => s.startTime === slotStartTime
          );
          if (targetPattern) {
            targetPattern.registeredCount = Math.max(0, (targetPattern.registeredCount || 0) - 1);
          }
        }

        await campaign.save({ session });
      }

      // Synchronize DigitalDonorRecord donationStatus to Cancelled so registration list removes it
      await DigitalDonorRecord.updateOne(
        { appointmentId: appointment._id },
        { $set: { donationStatus: 'Cancelled', lastUpdatedAt: new Date() } },
        { session }
      );

      // Invalidate ETicket
      if (appointment.eTicketId) {
        await ETicket.updateOne(
          { _id: appointment.eTicketId },
          { $set: { qrPayloadSigned: 'INVALIDATED' } },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return appointment;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  public static async downloadETicket(id: string, donorId: string) {
    const appointment = await Appointment.findOne({ _id: id, donorId });
    if (!appointment) {
      throw new Error('APPOINTMENT_NOT_FOUND');
    }

    if (appointment.status === AppointmentStatus.Pending || !appointment.eTicketId) {
      throw new Error('ETICKET_NOT_READY');
    }

    const eTicket = await ETicket.findById(appointment.eTicketId)
      .populate({
        path: 'appointmentId',
        populate: { path: 'campaignId' }
      })
      .lean();
    if (!eTicket) {
      throw new Error('ETICKET_NOT_FOUND');
    }

    return eTicket;
  }

  public static async syncToBloodCenter(id: string, donorId: string) {
    const { Appointment } = await import('../models/appointment.model');
    const { DonorProfile } = await import('../../auth-account/models/donor-profile.model');
    
    const appointment = await Appointment.findOne({ _id: id, donorId })
      .populate('screeningFormId')
      .populate('campaignId')
      .lean();
      
    if (!appointment) {
      throw new Error('APPOINTMENT_NOT_FOUND');
    }

    const donorProfile = await DonorProfile.findOne({ userId: donorId }).lean();

    // Mock API call payload
    const payload = {
      appointmentId: appointment._id,
      donor: {
        id: donorProfile?._id,
        name: donorProfile?.fullName,
        bloodType: donorProfile?.bloodType,
        idDocument: donorProfile?.idDocumentNumber
      },
      campaign: appointment.campaignId,
      timeSlot: appointment.timeSlot,
      status: appointment.status,
      screeningResponses: appointment.screeningFormId
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Information successfully sent to BloodCenter for review and confirmation',
      syncedAt: new Date(),
      payload
    };
  }
}

