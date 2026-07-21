import mongoose from 'mongoose';
import { BookingService } from '../services/booking.service';
import { Appointment, AppointmentStatus } from '../models/appointment.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';

jest.mock('mongoose', () => {
  const m = {
    startSession: jest.fn(),
    Types: {
      ObjectId: jest.fn().mockImplementation(() => 'mocked-object-id')
    },
    models: {
      Campaign: {
        find: jest.fn(),
        findById: jest.fn(),
        findOne: jest.fn(),
        updateOne: jest.fn(),
        init: jest.fn().mockResolvedValue({}),
        createCollection: jest.fn().mockResolvedValue({}),
      }
    },
    model: jest.fn().mockReturnValue({
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
      init: jest.fn().mockResolvedValue({}),
      createCollection: jest.fn().mockResolvedValue({}),
    }),
    Schema: jest.fn()
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
  },
  AppointmentStatus: {
    Scheduled: 'Scheduled',
    CheckedIn: 'CheckedIn',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
    NoShow: 'NoShow'
  }
}));

jest.mock('../models/screening-form.model', () => ({
  ScreeningForm: {
    init: jest.fn().mockResolvedValue({}),
    createCollection: jest.fn().mockResolvedValue({}),
  }
}));

jest.mock('../models/eticket.model', () => ({
  ETicket: {
    init: jest.fn().mockResolvedValue({}),
    createCollection: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn(),
    findById: jest.fn(),
  }
}));

jest.mock('../../auth-account/models/donor-profile.model', () => ({
  DonorProfile: {
    findOne: jest.fn(),
  }
}));

describe('BookingService Unit Tests', () => {
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

  describe('createAppointment', () => {
    it('should throw CAMPAIGN_NOT_ACTIVE if campaign is not active', async () => {
      const mockCampaign = { status: 'Draft', session: jest.fn().mockResolvedValue({ status: 'Draft' }) };
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCampaign)
      });

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1' }))
        .rejects.toThrow('CAMPAIGN_NOT_ACTIVE');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('should throw CAMPAIGN_FULL if campaign is full', async () => {
      const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 10 };
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCampaign)
      });

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1' }))
        .rejects.toThrow('CAMPAIGN_FULL');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('should throw ELIGIBILITY_FAILED_84_DAYS if last donation was < 84 days', async () => {
      const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 5 };
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCampaign)
      });

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 80);

      (Appointment.findOne as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue({ appointmentDate: recentDate })
      });

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1', appointmentDate: new Date() }))
        .rejects.toThrow('ELIGIBILITY_FAILED_84_DAYS');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('should throw DUPLICATE_APPOINTMENT if duplicate found', async () => {
      const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 5 };
      (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCampaign)
      });

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 90);
      (Appointment.findOne as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue({ appointmentDate: oldDate })
      }); // Last completed

      (Appointment.findOne as jest.Mock).mockReturnValueOnce({ status: 'Scheduled' }); // Existing duplicate

      await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1', appointmentDate: new Date() }))
        .rejects.toThrow('DUPLICATE_APPOINTMENT');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('cancelAppointment', () => {
    it('should throw CANCELLATION_DEADLINE_PASSED if < 24 hours', async () => {
      const apptDate = new Date();
      apptDate.setHours(apptDate.getHours() + 10); // 10 hours from now

      (Appointment.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({ status: 'Scheduled', appointmentDate: apptDate })
      });

      await expect(BookingService.cancelAppointment('a1', 'donor-1'))
        .rejects.toThrow('CANCELLATION_DEADLINE_PASSED');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });

    it('should throw INVALID_STATUS_TRANSITION if already cancelled', async () => {
      (Appointment.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({ status: 'Cancelled' })
      });

      await expect(BookingService.cancelAppointment('a1', 'donor-1'))
        .rejects.toThrow('INVALID_STATUS_TRANSITION');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
    });
  });
});
