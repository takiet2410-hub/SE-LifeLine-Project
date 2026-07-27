import { RegistrationService } from '../services/registration.service';
import { UpdateScreeningSchema, QueryRegistrationListSchema, GetRegistrationDetailsSchema } from '../schemas/registration.schema';
import { requireStaffRole } from '../middleware/role.middleware';
import { Campaign } from '../../campaign/models/campaign.model';
import { Appointment } from '../../booking/models/appointment.model';
import { ScreeningForm } from '../../booking/models/screening-form.model';
import { User } from '../../auth-account/models/user.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { DigitalDonorRecord } from '../models/digital-donor-record.model';
import { AuditLog } from '../models/audit-log.model';

describe('Donor Registration & Health Screening Module (BC-UC-04, BC-UC-05)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Zod Validation Schemas (T004)', () => {
    it('should reject status values outside fixed enum', () => {
      const result = UpdateScreeningSchema.safeParse({
        params: { registrationId: '65f1a2b3c4d5e6f7a8b9c0d1' },
        body: {
          vitals: { bloodPressure: '120/80', weight: 65, bodyTemperature: 36.5, hemoglobinLevel: 13.5 },
          status: 'INVALID_APPROVED_STATUS'
        }
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid blood pressure regex format', () => {
      const result = UpdateScreeningSchema.safeParse({
        params: { registrationId: '65f1a2b3c4d5e6f7a8b9c0d1' },
        body: {
          vitals: { bloodPressure: '120-80', weight: 65, bodyTemperature: 36.5, hemoglobinLevel: 13.5 },
          status: 'Eligible for Donation'
        }
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive vitals', () => {
      const result = UpdateScreeningSchema.safeParse({
        params: { registrationId: '65f1a2b3c4d5e6f7a8b9c0d1' },
        body: {
          vitals: { bloodPressure: '120/80', weight: -5, bodyTemperature: 36.5, hemoglobinLevel: 13.5 },
          status: 'Eligible for Donation'
        }
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid screening update payload', () => {
      const result = UpdateScreeningSchema.safeParse({
        params: { registrationId: '65f1a2b3c4d5e6f7a8b9c0d1' },
        body: {
          vitals: { bloodPressure: '120/80', weight: 65.5, bodyTemperature: 36.6, hemoglobinLevel: 13.5 },
          screeningNotes: 'Normal vitals',
          status: 'Eligible for Donation'
        }
      });
      expect(result.success).toBe(true);
    });

    it('should validate registration list query parameters', () => {
      const result = QueryRegistrationListSchema.safeParse({
        params: { campaignId: '65f1a2b3c4d5e6f7a8b9c0a0' },
        query: { page: '2', limit: '10', status: 'CheckedIn' }
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query?.page).toBe(2);
        expect(result.data.query?.limit).toBe(10);
      }
    });
  });

  describe('RBAC Middleware (T005)', () => {
    it('should block non-staff roles with 403 Forbidden', () => {
      const req: any = { user: { role: 'Donor' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      requireStaffRole(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'FORBIDDEN' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow BloodCenterStaff role', () => {
      const req: any = { user: { role: 'BloodCenterStaff' } };
      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      requireStaffRole(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should allow Administrator role', () => {
      const req: any = { user: { role: 'Administrator' } };
      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      requireStaffRole(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('RegistrationService (T006, T010, T014)', () => {
    it('BC-UC-04: getCampaignRegistrations throws 404 if campaign is not found', async () => {
      jest.spyOn(Campaign, 'findById').mockResolvedValue(null);

      await expect(
        RegistrationService.getCampaignRegistrations('65f1a2b3c4d5e6f7a8b9c0a0', {}, 'actor-123')
      ).rejects.toThrow('Campaign not found');
    });

    it('BC-UC-04: getCampaignRegistrations returns paginated list with populated donor summary and writes AuditLog', async () => {
      const mockCampaign = { _id: '65f1a2b3c4d5e6f7a8b9c0a0', name: 'Blood Drive' };
      const mockAppointments = [
        {
          _id: '65f1a2b3c4d5e6f7a8b9c0d1',
          campaignId: '65f1a2b3c4d5e6f7a8b9c0a0',
          donorId: '65f1a2b3c4d5e6f7a8b9c001',
          appointmentDate: new Date('2026-08-01'),
          timeSlot: '08:00 - 09:00',
          status: 'CheckedIn',
          createdAt: new Date('2026-07-25')
        }
      ];

      jest.spyOn(Campaign, 'findById').mockResolvedValue(mockCampaign as any);

      const chainMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAppointments)
      };

      jest.spyOn(Appointment, 'find').mockReturnValue(chainMock as any);
      jest.spyOn(Appointment, 'countDocuments').mockResolvedValue(1 as any);

      jest.spyOn(User, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: '65f1a2b3c4d5e6f7a8b9c001',
          idDocumentNumber: '123456789012',
          phone: '0912345678'
        })
      } as any);

      jest.spyOn(DonorProfile, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          userId: '65f1a2b3c4d5e6f7a8b9c001',
          fullName: 'Nguyen Van Donor',
          phoneNumber: '0912345678',
          bloodType: 'O+'
        })
      } as any);

      jest.spyOn(DigitalDonorRecord, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      jest.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const result = await RegistrationService.getCampaignRegistrations(
        '65f1a2b3c4d5e6f7a8b9c0a0',
        { page: 1, limit: 10 },
        '65f1a2b3c4d5e6f7a8b9c999'
      );

      expect(result.totalCount).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].donor.fullName).toBe('Nguyen Van Donor');
      expect(result.items[0].donor.bloodType).toBe('O+');
      expect(AuditLog.create).toHaveBeenCalled();
    });

    it('BC-UC-04: getCampaignRegistrations returns empty result shape when no appointments match', async () => {
      jest.spyOn(Campaign, 'findById').mockResolvedValue({ _id: 'c1' } as any);

      const chainMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      jest.spyOn(Appointment, 'find').mockReturnValue(chainMock as any);
      jest.spyOn(Appointment, 'countDocuments').mockResolvedValue(0 as any);
      jest.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const result = await RegistrationService.getCampaignRegistrations(
        '65f1a2b3c4d5e6f7a8b9c0a0',
        { status: 'NonExistent' },
        'actor-123'
      );

      expect(result).toEqual({
        items: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 20,
        totalPages: 0
      });
    });

    it('BC-UC-05: getRegistrationById returns full registration details', async () => {
      const mockAppointment = {
        _id: '65f1a2b3c4d5e6f7a8b9c0d1',
        campaignId: '65f1a2b3c4d5e6f7a8b9c0a0',
        donorId: '65f1a2b3c4d5e6f7a8b9c001',
        appointmentDate: new Date('2026-08-01'),
        timeSlot: '09:00 - 10:00',
        status: 'CheckedIn',
        createdAt: new Date('2026-07-25'),
        updatedAt: new Date('2026-07-25')
      };

      jest.spyOn(Appointment, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockAppointment)
      } as any);

      jest.spyOn(User, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: '65f1a2b3c4d5e6f7a8b9c001',
          idDocumentNumber: '123456789012',
          email: 'donor@test.com'
        })
      } as any);

      jest.spyOn(DonorProfile, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          userId: '65f1a2b3c4d5e6f7a8b9c001',
          fullName: 'Nguyen Van Donor',
          phoneNumber: '0912345678',
          bloodType: 'O+',
          permanentAddress: '123 Street'
        })
      } as any);

      jest.spyOn(ScreeningForm, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'sf-1',
          appointmentId: '65f1a2b3c4d5e6f7a8b9c0d1',
          medicalHistory: {},
          currentHealthStatus: 'Good',
          eligibilityFlag: 'RequiresReview'
        })
      } as any);

      jest.spyOn(DigitalDonorRecord, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      const details = await RegistrationService.getRegistrationById('65f1a2b3c4d5e6f7a8b9c0d1');

      expect(details.registrationId).toBe('65f1a2b3c4d5e6f7a8b9c0d1');
      expect(details.donor.fullName).toBe('Nguyen Van Donor');
      expect(details.donor.bloodType).toBe('O+');
      expect(details.screening?.eligibilityFlag).toBe('RequiresReview');
    });

    it('BC-UC-05: getRegistrationById throws 404 if registration is not found', async () => {
      jest.spyOn(Appointment, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      await expect(
        RegistrationService.getRegistrationById('65f1a2b3c4d5e6f7a8b9c0d1')
      ).rejects.toThrow('Donor registration record not found');
    });

    it('should accept partial update payload (e.g. only bloodType or only status)', () => {
      const result = UpdateScreeningSchema.safeParse({
        params: { registrationId: '65f1a2b3c4d5e6f7a8b9c0d1' },
        body: {
          bloodType: 'AB+'
        }
      });
      expect(result.success).toBe(true);

      const resultUnknown = UpdateScreeningSchema.safeParse({
        params: { registrationId: '65f1a2b3c4d5e6f7a8b9c0d1' },
        body: {
          bloodType: 'Unknown'
        }
      });
      expect(resultUnknown.success).toBe(true);
    });

    it('should sync bloodType to DonorProfile when bloodType is provided in updateRegistrationScreening', async () => {
      const mockDonorProfileUpdate = jest.spyOn(DonorProfile, 'findOneAndUpdate').mockResolvedValue({} as any);
      jest.spyOn(DonorProfile, 'findOne').mockImplementation(() => ({ lean: jest.fn().mockResolvedValue({ fullName: 'Test Donor', bloodType: 'B+' }) }) as any);
      jest.spyOn(User, 'findOne').mockImplementation(() => ({ lean: jest.fn().mockResolvedValue({ idDocumentNumber: '123456789' }) }) as any);

      const mockAppointmentObj = {
        _id: '65f1a2b3c4d5e6f7a8b9c0d1',
        donorId: '65f1a2b3c4d5e6f7a8b9c000',
        campaignId: '65f1a2b3c4d5e6f7a8b9c999',
        appointmentDate: new Date(),
        timeSlot: '09:00 - 10:00',
        status: 'Scheduled',
        save: jest.fn().mockResolvedValue({})
      };
      jest.spyOn(Appointment, 'findById').mockImplementation(() => {
        const queryObj: any = Promise.resolve(mockAppointmentObj);
        queryObj.lean = jest.fn().mockResolvedValue(mockAppointmentObj);
        queryObj.populate = jest.fn().mockReturnValue(queryObj);
        return queryObj;
      });

      const mockForm = {
        save: jest.fn().mockResolvedValue({}),
        lean: jest.fn().mockResolvedValue(null)
      };
      jest.spyOn(ScreeningForm, 'findOne').mockImplementation(() => mockForm as any);

      const mockRecord = {
        save: jest.fn().mockResolvedValue({}),
        lean: jest.fn().mockResolvedValue(null)
      };
      jest.spyOn(DigitalDonorRecord, 'findOne').mockImplementation(() => mockRecord as any);

      jest.spyOn(AuditLog, 'create').mockResolvedValue([] as any);

      await RegistrationService.updateRegistrationScreening(
        '65f1a2b3c4d5e6f7a8b9c0d1',
        { bloodType: 'B+' },
        'staff-123'
      );

      expect(mockDonorProfileUpdate).toHaveBeenCalledWith(
        { userId: '65f1a2b3c4d5e6f7a8b9c000' },
        { bloodType: 'B+' },
        expect.any(Object)
      );
    });
  });
});
