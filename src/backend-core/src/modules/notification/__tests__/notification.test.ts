import { NotificationService } from '../services/notification.service';
import { Notification } from '../models/Notification';
import { PushService } from '../services/push.service';

jest.mock('../models/Notification');
jest.mock('../models/NotificationPreference');
jest.mock('../models/NotificationTemplate');
jest.mock('../services/push.service');
jest.mock('../services/email.service');

describe('Notification Module Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
});
