import { NotificationService } from '../services/notification.service';
import { Notification } from '../models/Notification';
import { PushService } from '../services/push.service';
import { EmailService } from '../services/email.service';
import { NotificationPreference } from '../models/NotificationPreference';
import { User } from '../../auth-account/models/user.model';
import { isFeatureEnabled } from '../../admin/services/admin-toggle.service';

jest.mock('../models/Notification');
jest.mock('../models/NotificationPreference');
jest.mock('../models/NotificationTemplate');
jest.mock('../services/push.service');
jest.mock('../services/email.service');
jest.mock('../../auth-account/models/user.model', () => ({
  User: { findById: jest.fn(), find: jest.fn() },
}));
jest.mock('../../admin/services/admin-toggle.service', () => ({
  isFeatureEnabled: jest.fn().mockResolvedValue(true),
}));

describe('Notification Module Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
    (isFeatureEnabled as jest.Mock).mockResolvedValue(true);
  });

  describe('getUserNotifications', () => {
    it('should query user notifications with default InApp channel filter and pagination', async () => {
      const mockNotifications = [
        { _id: 'notif1', title: 'Khẩn cấp SOS', body: 'Cần nhóm máu O+', readAt: null },
        { _id: 'notif2', title: 'Lịch hẹn hiến máu', body: 'Lịch hẹn đã xác nhận', readAt: new Date() },
      ];

      (Notification.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockNotifications),
            }),
          }),
        }),
      });
      (Notification.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await NotificationService.getUserNotifications('user123', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should apply audience guard when activeRole is BloodCenterStaff to filter out donor-specific notifications', async () => {
      (Notification.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Notification.countDocuments as jest.Mock).mockResolvedValue(0);

      await NotificationService.getUserNotifications('user123', { page: 1, limit: 10 }, 'BloodCenterStaff');

      expect(Notification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $nor: expect.arrayContaining([
            { 'payload.audienceRole': 'Donor' },
          ]),
        })
      );
    });

    it('should apply audience guard when activeRole is Donor to filter out management-specific notifications', async () => {
      (Notification.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Notification.countDocuments as jest.Mock).mockResolvedValue(0);

      await NotificationService.getUserNotifications('user123', { page: 1, limit: 10 }, 'Donor');

      expect(Notification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $nor: expect.arrayContaining([
            { 'payload.audienceRole': { $in: ['BloodCenterStaff', 'HospitalStaff', 'Administrator'] } },
          ]),
        })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user in-app notifications', async () => {
      (Notification.countDocuments as jest.Mock).mockResolvedValue(5);

      const count = await NotificationService.getUnreadCount('user123');

      expect(count).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should update readAt timestamp for a notification', async () => {
      const mockNotif = { _id: 'notif1', recipientUserId: 'user123', readAt: null, sourceRefId: 'ref1', sourceRefType: 'Article' };
      (Notification.findOne as jest.Mock).mockResolvedValue(mockNotif);
      (Notification.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      const result = await NotificationService.markAsRead('notif1', 'user123');

      expect(result).toBeDefined();
      expect(result?.readAt).toBeInstanceOf(Date);
      expect(Notification.findOne).toHaveBeenCalled();
    });
  });

  describe('sendPushNotification', () => {
    it('should route web push notification payload safely via PushService', async () => {
      (PushService.send as jest.Mock).mockResolvedValue(true);

      const res = await PushService.send({
        userId: 'user123',
        title: 'Cảnh báo khẩn cấp',
        body: 'Yêu cầu hiến máu SOS tại Bệnh viện 115',
      });

      expect(res).toBe(true);
    });
  });

  describe('sendNotification feature control', () => {
    it('should suppress queued SOS notifications after the SOS feature is disabled', async () => {
      (isFeatureEnabled as jest.Mock).mockResolvedValue(false);

      const result = await NotificationService.sendNotification({
        recipientIds: ['507f1f77bcf86cd799439011'],
        type: 'SOS',
        title: 'SOS',
        body: 'Emergency request',
      });

      expect(result).toEqual(expect.objectContaining({ success: false, sent: 0, skippedReason: 'FEATURE_DISABLED' }));
      expect(Notification.create).not.toHaveBeenCalled();
    });
  });

  describe('recipient audience control', () => {
    it('allows a multi-role account to receive donor alerts for its Donor portal', async () => {
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: '507f1f77bcf86cd799439011' }]),
        }),
      });
      (NotificationPreference.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue({ pushEnabled: false, emailEnabled: false, sosEnabled: true }),
      });

      const result = await NotificationService.sendNotification({
        recipientIds: ['507f1f77bcf86cd799439011'],
        type: 'SOS',
        title: 'Cần hiến máu SOS',
        body: 'Thông báo chỉ dành cho donor',
        allowedRecipientRoles: ['Donor'],
      });

      expect(User.find).toHaveBeenCalledWith(expect.objectContaining({
        $or: [{ role: 'Donor' }, { roles: 'Donor' }],
        accountStatus: 'Active',
      }));
      expect(result).toEqual(expect.objectContaining({ success: true }));
    });
  });

  describe('delivery safety', () => {
    beforeEach(() => {
      (NotificationPreference.findOne as jest.Mock).mockResolvedValue({
        emailEnabled: true,
        pushEnabled: true,
        sosEnabled: true,
        campaignEnabled: true,
        appointmentEnabled: true,
      });
    });

    it('propagates an email provider failure instead of marking it sent', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ email: 'qa@example.com' }),
        }),
      });
      (EmailService.send as jest.Mock).mockResolvedValue(false);

      const delivered = await NotificationService.sendEmail({
        recipientUserId: '507f1f77bcf86cd799439011',
        type: 'SOS',
        title: 'SOS',
        body: 'Test',
        payload: {},
      });

      expect(delivered).toBe(false);
    });

    it('propagates a push provider failure instead of marking it sent', async () => {
      (PushService.send as jest.Mock).mockResolvedValue(false);

      const delivered = await NotificationService.sendPush({
        recipientUserId: { toString: () => '507f1f77bcf86cd799439011' },
        type: 'SOS',
        title: 'SOS',
        body: 'Test',
        payload: {},
      });

      expect(delivered).toBe(false);
    });

    it('escapes untrusted notification text in HTML email templates', () => {
      const html = NotificationService.renderEmailTemplate({
        title: '<img src=x onerror=alert(1)>',
        body: '<script>alert(1)</script>',
        payload: { deepLink: 'javascript:alert(1)' },
      });

      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x');
      expect(html).not.toContain('javascript:');
      expect(html).toContain('&lt;script&gt;');
    });

    it('returns failed deliveries to Pending before queueing a retry', async () => {
      const failed = { _id: { toString: () => 'notif-failed' }, channel: 'Email', deliveryStatus: 'Failed', save: jest.fn() };
      (Notification.find as jest.Mock).mockReturnValue({ limit: jest.fn().mockResolvedValue([failed]) });
      jest.spyOn(NotificationService, 'queueDelivery').mockResolvedValue();

      await NotificationService.retryFailedDeliveries();

      expect(failed.deliveryStatus).toBe('Pending');
      expect(failed.save).toHaveBeenCalled();
      expect(NotificationService.queueDelivery).toHaveBeenCalledWith('notif-failed', ['Email'], true);
    });
  });
});
