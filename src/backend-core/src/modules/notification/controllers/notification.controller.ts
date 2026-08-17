import mongoose, { Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { Notification, INotification } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { NotificationService } from '../services/notification.service';
import { UserDevice } from '../models/UserDevice';
import { validateRequest } from '../../../shared/validate.middleware';
import { 
  NotificationQuerySchema, 
  MarkReadSchema, 
  NotificationPreferenceSchema,
  SendNotificationSchema,
  NotificationTemplateSchema 
} from '../schemas/notification.schema';

export class NotificationController {
  public static async listNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const query = req.query as any;

      const result = await NotificationService.getUserNotifications(userId, {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20,
        type: query.type,
        status: query.status,
        channel: query.channel,
        startDate: query.startDate,
        endDate: query.endDate,
      });

      console.log(`[NotificationController] User ${userId} requested notifications. Found: ${result.data.length}, total: ${result.total}`);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async debugSeed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      
      const newNotif = await Notification.create({
        recipientUserId: userId,
        type: 'SOS',
        channel: 'WebPush',
        title: 'KHẨN CẤP: Bệnh viện Chợ Rẫy (MOCK DATA) đang cần máu A+',
        body: 'Nhóm máu A+ của bạn có thể cứu sống một bệnh nhân ngay lúc này. Xin vui lòng hiến máu khẩn cấp!',
        sourceRefId: new mongoose.Types.ObjectId().toString(),
        sourceRefType: 'SOSRequest',
        payload: {
          hospitalName: 'Bệnh viện Chợ Rẫy (MOCK DATA)',
          hospitalAddress: '201B Nguyễn Chí Thanh, Quận 5, TP.HCM',
          patientReference: 'PAT-12345',
          requiredQuantityMl: 250,
          fulfillmentDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          bloodType: 'A+',
          urgencyLevel: 'Critical',
          hospitalLocation: {
            type: 'Point',
            coordinates: [106.659616, 10.757826]
          }
        }
      });
      
      res.status(200).json({ success: true, data: newNotif, message: 'Seeded test notification successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async getNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { id } = req.params;
      const notification = await NotificationService.getNotificationById(String(id), userId);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  public static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { id } = req.params;
      const notification = await NotificationService.markAsRead(String(id), userId);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  public static async markMultipleAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { ids, markAllAsRead } = req.body;

      const result = await NotificationService.markMultipleAsRead(userId, ids, markAllAsRead);
      
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async respondToSOS(req: Request, res: Response, next: NextFunction) {
    try {
      const rawUserId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
      const userIdStr = typeof rawUserId === 'object' ? rawUserId.toString() : String(rawUserId || '');
      const rawId = req.params.id;
      const idStr = Array.isArray(rawId) ? String(rawId[0]) : String(rawId || '');
      const { response } = req.body; // 'accepted' or 'declined'

      const userFilter: any = Types.ObjectId.isValid(userIdStr) ? { $in: [userIdStr, new Types.ObjectId(userIdStr)] } : userIdStr;
      const idFilter: any = Types.ObjectId.isValid(idStr) ? { $in: [idStr, new Types.ObjectId(idStr)] } : idStr;

      const notif = await Notification.findOne({ _id: idFilter, recipientUserId: userFilter });
      if (!notif) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      const sosRequestId = notif.sourceRefId?.toString() || (notif.payload as any)?.sourceRefId || (notif.payload as any)?.id;
      if (!sosRequestId) {
        return res.status(400).json({ success: false, message: 'Mã yêu cầu SOS không hợp lệ' });
      }

      // Call SOSRequestService to record it and handle concurrency
      const { SOSRequestService } = await import('../../sos-request/services/sos-request.service');
      const sosResult = await SOSRequestService.recordDonorResponse(sosRequestId, userIdStr, response);

      notif.payload = {
        ...notif.payload,
        donorResponse: response
      };
      notif.markModified('payload');
      await notif.save();

      res.status(200).json({ success: true, data: notif, sosResult });
    } catch (error: any) {
      const status = error.statusCode || error.status || 400;
      res.status(status).json({ success: false, message: error.message || 'Lỗi khi ghi nhận phản hồi SOS' });
    }
  }

  public static async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { id } = req.params;
      const result = await NotificationService.deleteNotification(String(id), userId);
      if (!result) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }

  public static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const count = await NotificationService.getUnreadCount(userId);
      console.log(`[NotificationController] User ${userId} requested unread count. Found: ${count}`);
      res.status(200).json({ success: true, count });
    } catch (error) {
      next(error);
    }
  }

  public static async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const prefs = await NotificationPreference.findOne({ userId }).sort({ updatedAt: -1 });
      
      if (!prefs) {
        // Return defaults
        return res.status(200).json({
          success: true,
          data: {
            sosEnabled: true,
            appointmentEnabled: true,
            campaignEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
            quietHoursStart: null,
            quietHoursEnd: null,
            timezone: 'Asia/Ho_Chi_Minh',
          },
        });
      }

      res.status(200).json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }

  public static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const updates = req.body;

      const prefs = await NotificationService.updatePreferences(userId, updates);

      // Sync emergencyOptIn to DonorProfile if sosEnabled was changed
      if (updates.sosEnabled !== undefined) {
        const { DonorProfile } = await import('../../auth-account/models/donor-profile.model');
        await DonorProfile.updateOne(
          { userId },
          { $set: { emergencyOptIn: Boolean(updates.sosEnabled) } }
        );
      }

      res.status(200).json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }

  // Admin/Internal endpoints
  public static async sendNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.sendNotification(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await NotificationTemplate.create(req.body);
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  public static async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await NotificationTemplate.find({ isActive: true }).sort({ eventType: 1 });
      res.status(200).json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }

  public static async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const template = await NotificationTemplate.findByIdAndUpdate(String(id), req.body, { new: true, runValidators: true });
      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }
      res.status(200).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  // ---- Device Token Registration ----
  
  public static async registerDeviceToken(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { fcmToken, platform, deviceType } = req.body;

      if (!fcmToken) {
        return res.status(400).json({ success: false, message: 'fcmToken is required' });
      }

      await UserDevice.findOneAndUpdate(
        { userId, fcmToken },
        { 
          $set: { 
            deviceType: deviceType || 'Unknown', 
            platform: platform || 'web',
            lastActiveAt: new Date()
          } 
        },
        { upsert: true, returnDocument: 'after' }
      );

      res.status(200).json({ success: true, message: 'Device token registered successfully' });
    } catch (error: any) {
      console.error('[NotificationController] Register token error:', error);
      res.status(500).json({ success: false, message: 'Failed to register device token' });
    }
  }

  public static async removeDeviceToken(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { fcmToken } = req.body;

      if (fcmToken) {
        await UserDevice.deleteOne({ userId, fcmToken });
      } else {
        // If no token provided, delete all tokens for this user (global logout)
        await UserDevice.deleteMany({ userId });
      }

      res.status(200).json({ success: true, message: 'Device token removed successfully' });
    } catch (error: any) {
      console.error('[NotificationController] Remove token error:', error);
      res.status(500).json({ success: false, message: 'Failed to remove device token' });
    }
  }
}
