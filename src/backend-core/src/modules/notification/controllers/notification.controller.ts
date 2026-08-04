import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { Notification, INotification } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { NotificationService } from '../services/notification.service';
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
        startDate: query.startDate,
        endDate: query.endDate,
      });

      console.log(`[NotificationController] User ${userId} requested notifications. Found: ${result.data.length}, total: ${result.total}`);

      const mappedData = result.data.map((notif: any) => {
        // If it's an SOS notification and missing payload (old data), inject a mock payload
        if (notif.type === 'SOS' && (!notif.payload || Object.keys(notif.payload).length === 0)) {
           return {
             ...(notif.toObject ? notif.toObject() : notif),
             payload: {
                hospitalName: 'Bệnh viện Chợ Rẫy (MOCK DATA)',
                hospitalAddress: '201B Nguyễn Chí Thanh, Quận 5, TP.HCM',
                patientReference: 'PAT-12345',
                requiredQuantityMl: 250,
                fulfillmentDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                bloodType: 'A+',
                urgencyLevel: 'Critical',
                hospitalLocation: { type: 'Point', coordinates: [106.659616, 10.757826] }
             }
           };
        }
        return notif;
      });

      res.status(200).json({
        success: true,
        data: mappedData,
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
      
      const newNotif = await NotificationService.createNotification({
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

      const notification = await NotificationService.getNotificationById(id, userId);
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

      const notification = await NotificationService.markAsRead(id, userId);
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
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { id } = req.params;
      const { response } = req.body; // 'accepted' or 'declined'

      const notif = await Notification.findOne({ _id: id, recipientUserId: userId });
      if (!notif) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      notif.payload = {
        ...notif.payload,
        donorResponse: response
      };
      // Tell mongoose that the mixed type payload has been modified
      notif.markModified('payload');
      await notif.save();

      // Optionally, call the SOSRequestService here to record it in the SOS request logic
      // import { SOSRequestService } from '../../sos-request/services/sos-request.service';
      // await SOSRequestService.recordDonorResponse(notif.sourceRefId.toString(), userId, response);

      res.status(200).json({ success: true, data: notif });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { id } = req.params;

      const result = await NotificationService.deleteNotification(id, userId);
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
      const prefs = await NotificationPreference.findOne({ donorId: userId });
      
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

      const prefs = await NotificationPreference.findOneAndUpdate(
        { donorId: userId },
        { $set: updates },
        { new: true, upsert: true, runValidators: true }
      );

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
      const template = await NotificationTemplate.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }
      res.status(200).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }
}