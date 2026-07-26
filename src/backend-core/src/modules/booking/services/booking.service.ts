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
import { sendBookingConfirmationEmail } from '../../../utils/email.util';

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', new mongoose.Schema({
  name: String,
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }
  },
  startDateTime: Date,
  endDateTime: Date,
  capacity: Number,
  registeredCount: Number,
  status: String,
  targetBloodGroups: [String],
  timeSlots: [{
    startTime: String,
    endTime: String,
    capacity: Number,
    registeredCount: Number
  }]
}, { collection: 'campaigns' }));

export class BookingService {
  public static async searchLocations(filters: any) {
    let query: any = { status: 'Active' };

    if (filters.lat !== undefined && filters.lng !== undefined) {
      const radiusInMeters = (filters.radius || 10) * 1000;
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

    if (filters.bloodType) {
      query.targetBloodGroups = filters.bloodType;
    }

    if (filters.date) {
      const searchDate = new Date(filters.date);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      query.startDateTime = { $lte: nextDate };
      query.endDateTime = { $gte: searchDate };
    }

    let campaigns = await Campaign.find(query).lean();

    if (filters.crowdingLevel) {
      campaigns = campaigns.filter(c => {
        if (!c.capacity) return true;
        const ratio = (c.registeredCount || 0) / c.capacity;
        if (filters.crowdingLevel === 'Low') return ratio < 0.5;
        if (filters.crowdingLevel === 'Medium') return ratio >= 0.5 && ratio < 0.8;
        if (filters.crowdingLevel === 'High') return ratio >= 0.8;
        return true;
      });
    }

    return campaigns;
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
      if (campaign.status !== 'Active') {
        throw new Error('CAMPAIGN_NOT_ACTIVE');
      }
      if (campaign.registeredCount >= campaign.capacity) {
        throw new Error('CAMPAIGN_FULL');
      }

      // 2. Validate 84-day eligibility
      // Find latest completed appointment
      const lastCompleted = await Appointment.findOne({ donorId, status: AppointmentStatus.Completed }).sort({ appointmentDate: -1 });
      if (lastCompleted) {
        const diffTime = Math.abs(new Date(appointmentDate).getTime() - lastCompleted.appointmentDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays < 84) {
          throw new Error('ELIGIBILITY_FAILED_84_DAYS');
        }
      }

      // 3. Prevent Duplicate Appointments (overlapping dates)
      const existing = await Appointment.findOne({ donorId, status: { $in: [AppointmentStatus.Pending, AppointmentStatus.Confirmed, AppointmentStatus.Scheduled, AppointmentStatus.CheckedIn] } });
      if (existing) {
        throw new Error('DUPLICATE_APPOINTMENT');
      }

      // 4. Validate Screening Form
      const donorProfile = await DonorProfile.findOne({ userId: donorId });
      
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

      // 8. Update Campaign capacity
      await Campaign.updateOne(
        { _id: campaignId },
        { $inc: { registeredCount: 1 } },
        { session }
      );

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
          const donorUser = await User.findById(fullAppointment.donorId).lean();
          const donorProfile = await DonorProfile.findOne({ userId: fullAppointment.donorId }).lean();
          const recipientEmail = donorUser?.email || donorProfile?.email;

          if (recipientEmail && fullAppointment.eTicketId) {
            const eTicket: any = fullAppointment.eTicketId;
            const campaign: any = fullAppointment.campaignId;
            sendBookingConfirmationEmail(
              recipientEmail,
              donorProfile?.fullName || 'Người hiến máu',
              campaign?.name || 'Chiến dịch hiến máu',
              fullAppointment.appointmentDate,
              fullAppointment.timeSlot,
              eTicket.ticketCode || '',
              eTicket.fileUrl || ''
            ).catch(err => console.error('Failed to send confirmation email:', err));
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

  public static async getAppointmentById(id: string, donorId: string) {
    const appointment = await Appointment.findOne({ _id: id, donorId })
      .populate('screeningFormId')
      .populate('eTicketId')
      .populate('campaignId')
      .lean();
    if (!appointment) {
      throw new Error('APPOINTMENT_NOT_FOUND');
    }
    return appointment;
  }

  public static async listAppointments(donorId: string) {
    return await Appointment.find({ donorId })
      .populate('campaignId')
      .sort({ appointmentDate: -1 })
      .lean();
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

      await Campaign.updateOne(
        { _id: appointment.campaignId },
        { $inc: { registeredCount: -1 } },
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

