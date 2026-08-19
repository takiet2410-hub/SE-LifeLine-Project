import { SOSRequestService } from '../services/sos-request.service';
import { SOSRequest } from '../models/sos-request.model';
import { AdminAuditLog } from '../../admin/models/audit-log.model';
import { Hospital } from '../../auth-account/models/hospital.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { SystemConfig } from '../../admin/models/system-config.model';
import { NotificationService } from '../../notification/services/notification.service';

jest.mock('../models/sos-request.model');
jest.mock('../../admin/models/audit-log.model');
jest.mock('../../auth-account/models/hospital.model');
jest.mock('../../auth-account/models/donor-profile.model');
jest.mock('../../admin/models/system-config.model');
jest.mock('../../notification/services/notification.service');
jest.mock('../../../config/queue.config', () => ({
  sosEvaluationQueue: {
    add: jest.fn().mockResolvedValue({ id: 'job_123' }),
  },
}));

describe('SOS Request Module Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSOSRequest', () => {
    it('should create SOS request with Pending status and write audit log to shared audit_logs collection', async () => {
      const validHospitalId = '507f1f77bcf86cd799439011';
      (Hospital.findById as jest.Mock).mockResolvedValue({
        _id: validHospitalId,
        name: 'Bệnh viện Chợ Rẫy',
        location: { coordinates: [106.659, 10.757] },
      });

      const mockSave = jest.fn().mockImplementation(function (this: any) {
        this._id = 'sos_request_999';
        return Promise.resolve(this);
      });
      (SOSRequest as unknown as jest.Mock).mockImplementation((data) => ({
        ...data,
        _id: 'sos_request_999',
        save: mockSave,
      }));

      (AdminAuditLog.create as jest.Mock).mockResolvedValue({ _id: 'audit_log_111' });

      const input = {
        patientReference: 'PATIENT_115',
        bloodType: 'O+',
        requiredQuantityMl: 700,
        urgencyLevel: 'Critical',
        fulfillmentDeadline: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = await SOSRequestService.createSOSRequest(input, 'staff_001', validHospitalId);

      expect(mockSave).toHaveBeenCalled();
      expect(AdminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionCategory: 'SOS Request',
          action: 'Create SOS Request',
          actorUserId: 'staff_001',
          resourceType: 'SOSRequest',
          status: 'Success',
        })
      );
    });
  });

  describe('getSOSRequests', () => {
    it('applies patient/ID search together with blood type and urgency filters before pagination', async () => {
      const populate = jest.fn().mockResolvedValue([{ _id: 'sos_1' }]);
      const limit = jest.fn().mockReturnValue({ populate });
      const skip = jest.fn().mockReturnValue({ limit });
      const sort = jest.fn().mockReturnValue({ skip });
      (SOSRequest.find as jest.Mock).mockReturnValue({ sort });
      (SOSRequest.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await SOSRequestService.getSOSRequests({
        page: 2,
        limit: 10,
        search: 'Nguyễn Văn A',
        bloodType: 'O+',
        urgencyLevel: 'Critical',
      });

      const query = (SOSRequest.find as jest.Mock).mock.calls[0][0];
      expect(query.bloodType).toBe('O+');
      expect(query.urgencyLevel).toBe('Critical');
      expect(query.$or).toHaveLength(2);
      expect(query.$or[0].patientReference).toEqual(expect.any(RegExp));
      expect(query.$or[1].$expr.$regexMatch.input).toEqual({ $toString: '$_id' });
      expect(skip).toHaveBeenCalledWith(10);
      expect(result).toEqual(expect.objectContaining({ total: 1, page: 2, totalPages: 1 }));
    });
  });

  describe('updateSOSRequestStatus', () => {
    it('should update SOS request status and record audit log', async () => {
      const mockSOS = {
        _id: 'sos_request_999',
        status: 'Pending',
        bloodType: 'A+',
        requiredQuantityMl: 500,
        save: jest.fn().mockResolvedValue(true),
      };
      (SOSRequest.findById as jest.Mock).mockResolvedValue(mockSOS);
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({ _id: 'audit_log_222' });

      const updated = await SOSRequestService.updateSOSRequestStatus('sos_request_999', 'Fulfilled');

      expect(mockSOS.status).toBe('Fulfilled');
      expect(mockSOS.save).toHaveBeenCalled();
      expect(AdminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionCategory: 'SOS Request',
          action: 'Update SOS Status',
          status: 'Success',
        })
      );
    });

    it('thanks accepted donors and contributing Blood Center staff when the SOS becomes fulfilled', async () => {
      const mockSOS = {
        _id: { toString: () => '507f1f77bcf86cd799439099' },
        status: 'NotificationsDispatched',
        bloodType: 'O+',
        requiredQuantityMl: 500,
        receivedQuantityMl: 500,
        acceptedDonorIds: [{ toString: () => '507f1f77bcf86cd799439011' }],
        directDonations: [],
        shipments: [{
          status: 'Received',
          dispatchedByStaffId: { toString: () => '507f1f77bcf86cd799439022' },
        }],
        save: jest.fn().mockResolvedValue(true),
      };
      (SOSRequest.findById as jest.Mock).mockResolvedValue(mockSOS);
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({});
      (NotificationService.sendNotification as jest.Mock).mockResolvedValue({ success: true });

      await SOSRequestService.updateSOSRequestStatus('507f1f77bcf86cd799439099', 'Fulfilled');

      expect(NotificationService.sendNotification).toHaveBeenCalledTimes(2);
      expect(NotificationService.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        recipientIds: ['507f1f77bcf86cd799439011'],
        allowedRecipientRoles: ['Donor'],
        payload: expect.objectContaining({ notificationKind: 'SOS_DONOR_COMPLETION_THANK_YOU' }),
      }));
      expect(NotificationService.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        recipientIds: ['507f1f77bcf86cd799439022'],
        allowedRecipientRoles: ['BloodCenterStaff'],
        payload: expect.objectContaining({ notificationKind: 'SOS_BLOOD_CENTER_COMPLETION_THANK_YOU' }),
      }));
    });
  });

  describe('recordDonorResponse', () => {
    it('rejects a response after the SOS request has expired', async () => {
      (SOSRequest.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ status: 'Expired' }),
        }),
      });

      await expect(
        SOSRequestService.recordDonorResponse('sos_request_999', 'donor_001', 'declined')
      ).rejects.toMatchObject({ statusCode: 409, code: 'SOS_NOT_ACTIVE' });
    });

    it('rejects an active-looking request when its deadline has passed', async () => {
      (SOSRequest.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            status: 'NotificationsDispatched',
            fulfillmentDeadline: new Date(Date.now() - 1000),
          }),
        }),
      });

      await expect(
        SOSRequestService.recordDonorResponse('sos_request_999', 'donor_001', 'declined')
      ).rejects.toMatchObject({ statusCode: 409, code: 'SOS_NOT_ACTIVE' });
    });

    it('records an accepted donor as a pledge without collecting blood or fulfilling the SOS', async () => {
      (SystemConfig.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      (DonorProfile.findOne as jest.Mock).mockResolvedValue(null);
      const request = {
        status: 'NotificationsDispatched',
        pledgedQuantityMl: 250,
        collectedQuantityMl: 0,
        receivedQuantityMl: 0,
        requiredQuantityMl: 250,
      };
      (SOSRequest.findOneAndUpdate as jest.Mock).mockResolvedValue(request);
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await SOSRequestService.recordDonorResponse(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
        'accepted'
      );

      const update = (SOSRequest.findOneAndUpdate as jest.Mock).mock.calls[0][1];
      expect(update.$inc).toEqual({ pledgedQuantityMl: 250 });
      expect(update.$inc.collectedQuantityMl).toBeUndefined();
      expect(request.status).toBe('NotificationsDispatched');
      expect(result).toEqual(expect.objectContaining({ status: 'accepted', pledgedQuantityMl: 250 }));
      expect((result as any).rewards).toBeUndefined();
    });
  });
});
