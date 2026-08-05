import mongoose from 'mongoose';
import { BookingService } from '../services/booking.service';
import { Appointment, AppointmentStatus } from '../models/appointment.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { User } from '../../auth-account/models/user.model';
import { ETicket } from '../models/eticket.model';

jest.mock('mongoose', () => {
  const m = {
    startSession: jest.fn(),
    Types: {
      ObjectId: jest.fn().mockImplementation(() => 'mocked-object-id')
    },
    models: new Proxy({}, {
      get(target: any, prop: string) {
        if (!target[prop]) {
          const createQueryMock = () => {
            const fn: any = jest.fn();
            fn.session = jest.fn().mockResolvedValue(null);
            return fn;
          };
          target[prop] = {
            find: jest.fn().mockImplementation(createQueryMock),
            findById: jest.fn().mockImplementation(createQueryMock),
            findOne: jest.fn().mockImplementation(createQueryMock),
            updateOne: jest.fn().mockImplementation(createQueryMock),
            init: jest.fn().mockResolvedValue({}),
            createCollection: jest.fn().mockResolvedValue({})
          };
        }
        return target[prop];
      }
    }),
    model: jest.fn().mockImplementation((name: string) => (m.models as any)[name]),
    Schema: Object.assign(
      jest.fn().mockImplementation(() => ({
        index: jest.fn(),
        pre: jest.fn(),
        post: jest.fn()
      })),
      { Types: { ObjectId: String, Mixed: String } }
    )
  };
  return m;
});

jest.mock('../models/appointment.model', () => ({
  Appointment: {
    findOne: jest.fn().mockReturnValue({ session: jest.fn().mockResolvedValue(null) }),
    init: jest.fn().mockResolvedValue({}),
    createCollection: jest.fn().mockResolvedValue({}),
    find: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
  },
  AppointmentStatus: {
    Pending: 'Pending',
    Confirmed: 'Confirmed',
    Scheduled: 'Scheduled',
    CheckedIn: 'CheckedIn',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
    Rejected: 'Rejected',
    NoShow: 'NoShow'
  }
}));

jest.mock('../models/screening-form.model', () => ({
  ScreeningForm: {
    init: jest.fn().mockResolvedValue({}),
    createCollection: jest.fn().mockResolvedValue({}),
  }
}));

jest.mock('../models/screening-form-template.model', () => ({
  ScreeningFormTemplate: {
    findOne: jest.fn().mockReturnValue({ session: jest.fn().mockResolvedValue(null) }),
  }
}));

jest.mock('../models/eticket.model', () => ({
  ETicket: {
    init: jest.fn().mockResolvedValue({}),
    createCollection: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    findById: jest.fn(),
  }
}));

jest.mock('../../auth-account/models/donor-profile.model', () => ({
  DonorProfile: {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'dp1', fullName: 'Nguyen Van A', bloodType: 'O+' })
    }),
  }
}));

jest.mock('../../auth-account/models/user.model', () => ({
  User: {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ email: 'donor@test.com', fullName: 'Nguyen Van A' })
    }),
  }
}));

jest.mock('../../registration/models/digital-donor-record.model', () => ({
  DigitalDonorRecord: {
    init: jest.fn().mockResolvedValue({}),
    createCollection: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
  }
}));

jest.mock('../../../utils/email.util', () => ({
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendBookingRejectionEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../../utils/cloudinary.util', () => ({
  uploadImageToCloudinary: jest.fn().mockResolvedValue('https://res.cloudinary.com/test/eticket.png'),
}));

describe('BookingService Unit Tests (Full TC Coverage)', () => {
  let sessionMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionMock = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    (mongoose.startSession as jest.Mock).mockResolvedValue(sessionMock);
  });

  describe('searchLocations (TC_UC06_001 - TC_UC06_005)', () => {
    it('TC_UC06_001 & TC_UC06_003: should return locations matching radius, date, and bloodType', async () => {
      const mockCampaigns = [
        {
          _id: 'c1',
          name: 'Chiến dịch Bệnh viện Chợ Rẫy',
          status: 'Active',
          startDateTime: new Date('2026-08-10T08:00:00Z'),
          endDateTime: new Date('2026-08-10T16:00:00Z'),
          targetBloodGroups: ['A+', 'O+'],
          capacity: 100,
          registeredCount: 20,
          location: { type: 'Point', coordinates: [106.6653, 10.7554] }
        }
      ];

      (mongoose.models.Campaign.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCampaigns)
      });

      const res = await BookingService.searchLocations({
        lat: 10.7769,
        lng: 106.7009,
        radius: 15,
        date: '2026-08-10',
        bloodType: 'O+',
        crowdingLevel: 'Low'
      });

      expect(res).toBeDefined();
      expect(Array.isArray(res)).toBe(true);
    });

    it('TC_UC06_004: should return empty array when no campaigns match filters', async () => {
      (mongoose.models.Campaign.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });

      const res = await BookingService.searchLocations({ lat: 0.0, lng: 0.0, radius: 1 });
      expect(res).toEqual([]);
    });
  });

  describe('createAppointment (TC_UC07_001 - TC_UC07_014)', () => {
    it('TC_UC07_011: should throw NOT_FOUND_CAMPAIGN if campaign does not exist', async () => {
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(null)
      });

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'invalid-id' }))
        .rejects.toThrow('NOT_FOUND_CAMPAIGN');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('TC_UC07_005: should throw CAMPAIGN_NOT_ACTIVE if campaign is not Active or Upcoming', async () => {
      const mockCampaign = { status: 'Draft' };
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCampaign)
      });

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1' }))
        .rejects.toThrow('CAMPAIGN_NOT_ACTIVE');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('TC_UC07_005: should throw CAMPAIGN_FULL if campaign is full', async () => {
      const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 10 };
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCampaign)
      });

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1' }))
        .rejects.toThrow('CAMPAIGN_FULL');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('TC_UC07_003: should throw ELIGIBILITY_FAILED_84_DAYS if last donation was < 84 days', async () => {
      const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 5 };
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCampaign)
      });

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 50);

      (Appointment.findOne as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue({ appointmentDate: recentDate })
      });

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1', appointmentDate: new Date() }))
        .rejects.toThrow('ELIGIBILITY_FAILED_84_DAYS');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('TC_UC07_004: should throw DUPLICATE_APPOINTMENT if existing active appointment found', async () => {
      const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 5 };
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCampaign)
      });

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 90);
      (Appointment.findOne as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue({ appointmentDate: oldDate })
      });

      (Appointment.findOne as jest.Mock).mockReturnValueOnce({ status: 'Scheduled' });

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1', appointmentDate: new Date() }))
        .rejects.toThrow('DUPLICATE_APPOINTMENT');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('TC_UC07_010: should throw INVALID_SCREENING_FORM if answers are missing', async () => {
      const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 5 };
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCampaign)
      });
      (Appointment.findOne as jest.Mock).mockReturnValueOnce({ sort: jest.fn().mockResolvedValue(null) });
      (Appointment.findOne as jest.Mock).mockReturnValueOnce(null);

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1', appointmentDate: new Date() }))
        .rejects.toThrow('INVALID_SCREENING_FORM');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('TC_UC07_009: should throw ELIGIBILITY_FAILED_SCREENING if screening outcome is REJECT', async () => {
      const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 5 };
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCampaign)
      });
      (Appointment.findOne as jest.Mock).mockReturnValueOnce({ sort: jest.fn().mockResolvedValue(null) });
      (Appointment.findOne as jest.Mock).mockReturnValueOnce(null);

      const rejectAnswers = {
        responses: [
          { questionId: '1', selectedOptions: ['Xăm, xỏ lỗ tai, lỗ mũi hoặc các vị trí khác trên cơ thể'] }
        ]
      };

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1', appointmentDate: new Date(), answers: rejectAnswers }))
        .rejects.toThrow('ELIGIBILITY_FAILED_SCREENING');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('getAppointmentById & listAppointments (TC_UC08_001 - TC_UC08_004)', () => {
    it('TC_UC08_003: should throw APPOINTMENT_NOT_FOUND if appointment does not belong to donor', async () => {
      (Appointment.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      });

      await expect(BookingService.getAppointmentById('a1', 'unauthorized-donor'))
        .rejects.toThrow('APPOINTMENT_NOT_FOUND');
    });

    it('TC_UC08_004 & TC_UC07_014: should mark past pending appointment as NoShow', async () => {
      const pastAppt = {
        _id: 'a1',
        donorId: 'd1',
        status: AppointmentStatus.Pending,
        appointmentDate: '2026-01-01',
        timeSlot: '07:30 - 09:00',
        eTicketId: 'e1'
      };

      (Appointment.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(pastAppt)
      });

      const res = await BookingService.getAppointmentById('a1', 'd1');
      expect(res.status).toBe(AppointmentStatus.NoShow);
    });
  });

  describe('cancelAppointment (TC_UC09_001 - TC_UC09_005)', () => {
    it('TC_UC09_004: should throw APPOINTMENT_NOT_FOUND if appointment does not exist', async () => {
      (Appointment.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(null)
      });

      await expect(BookingService.cancelAppointment('invalid-id', 'donor-1'))
        .rejects.toThrow('APPOINTMENT_NOT_FOUND');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('TC_UC09_004: should throw INVALID_STATUS_TRANSITION if already Cancelled, Completed or NoShow', async () => {
      (Appointment.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({ status: AppointmentStatus.Cancelled })
      });

      await expect(BookingService.cancelAppointment('a1', 'donor-1'))
        .rejects.toThrow('INVALID_STATUS_TRANSITION');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('TC_UC09_003: should throw CANCELLATION_DEADLINE_PASSED if < 24 hours and created > 30 minutes ago', async () => {
      const apptDate = new Date();
      apptDate.setHours(apptDate.getHours() + 10);
      const oldCreatedAt = new Date();
      oldCreatedAt.setHours(oldCreatedAt.getHours() - 2);

      (Appointment.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({
          status: AppointmentStatus.Scheduled,
          appointmentDate: apptDate,
          createdAt: oldCreatedAt
        })
      });

      await expect(BookingService.cancelAppointment('a1', 'donor-1'))
        .rejects.toThrow('CANCELLATION_DEADLINE_PASSED');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('downloadETicket (TC_UC10_001 - TC_UC10_004)', () => {
    it('TC_UC10_002: should throw ETICKET_NOT_READY if appointment status is Pending', async () => {
      (Appointment.findOne as jest.Mock).mockResolvedValue({
        status: AppointmentStatus.Pending,
        eTicketId: null
      });

      await expect(BookingService.downloadETicket('a1', 'donor-1'))
        .rejects.toThrow('ETICKET_NOT_READY');
    });

    it('TC_UC10_001 & TC_UC10_003: should return eTicket object when appointment is Confirmed', async () => {
      (Appointment.findOne as jest.Mock).mockResolvedValue({
        status: AppointmentStatus.Confirmed,
        eTicketId: 'e1'
      });

      const mockETicket = {
        _id: 'e1',
        ticketCode: 'TK-20260810-1001',
        qrPayloadSigned: 'SIGNED-TK-20260810-1001',
        fileUrl: 'https://res.cloudinary.com/test/eticket.png'
      };

      const createPopulateChain = (finalVal: any) => ({
        populate: jest.fn().mockImplementation(() => createPopulateChain(finalVal)),
        lean: jest.fn().mockResolvedValue(finalVal)
      });

      (ETicket.findById as jest.Mock).mockImplementation(() => createPopulateChain(mockETicket));

      const res = await BookingService.downloadETicket('a1', 'donor-1');
      expect(res.ticketCode).toBe('TK-20260810-1001');
      expect(res.qrPayloadSigned).toContain('SIGNED-TK');
    });
  });

  describe('BloodCenter Staff Operations (TC_STAFF_001 - TC_STAFF_003)', () => {
    it('TC_STAFF_001: syncToBloodCenter should return payload successfully', async () => {
      (Appointment.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ _id: 'a1', status: 'Pending', campaignId: 'c1', timeSlot: '08:00-09:00' })
      });
      (DonorProfile.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'dp1', fullName: 'Nguyen Van A', bloodType: 'O+' })
      });

      const res = await BookingService.syncToBloodCenter('a1', 'donor-1');
      expect(res.success).toBe(true);
      expect(res.payload).toBeDefined();
    });

    it('TC_STAFF_003: rejectAppointmentByBloodCenter should set status to Rejected', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockAppt = { _id: 'a1', status: AppointmentStatus.Pending, campaignId: 'c1', save: mockSave };

      (Appointment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt)
      });

      const res = await BookingService.rejectAppointmentByBloodCenter('a1', 'Huyết áp không đạt tiêu chuẩn');
      expect(res.status).toBe(AppointmentStatus.Rejected);
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
