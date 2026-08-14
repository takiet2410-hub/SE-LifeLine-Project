import { SOSRequestService } from '../services/sos-request.service';
import { SOSRequest } from '../models/sos-request.model';
import { AdminAuditLog } from '../../admin/models/audit-log.model';
import { Hospital } from '../../auth-account/models/hospital.model';

jest.mock('../models/sos-request.model');
jest.mock('../../admin/models/audit-log.model');
jest.mock('../../auth-account/models/hospital.model');
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
  });
});
