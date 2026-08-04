import { Types } from 'mongoose';
import { Notification, INotification, INotificationPayload, IDeliveryStatus } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { EmailService } from './email.service';
import { PushService } from './push.service';

export interface NotificationFilters {
  page: number;
  limit: number;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class NotificationService {
  /**
   * Get user notifications with pagination and filters
   */
  static async getUserNotifications(
    userId: string,
    filters: NotificationFilters
  ): Promise<PaginatedResult<INotification>> {
    const { page, limit, type, status, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const query: any = { recipientUserId: new Types.ObjectId(userId) };

    if (type) query.type = type;
    if (status === 'read') query.readAt = { $ne: null };
    else if (status === 'unread') query.readAt = null;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single notification by ID (with ownership check)
   */
  static async getNotificationById(id: string, userId: string): Promise<INotification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Notification.findOne({ _id: id, recipientUserId: userId }).lean();
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(id: string, userId: string): Promise<INotification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Notification.findOneAndUpdate(
      { _id: id, recipientUserId: userId, readAt: null },
      { readAt: new Date() },
      { new: true }
    ).lean();
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(
    userId: string,
    ids?: string[],
    markAllAsRead = false
  ): Promise<{ modifiedCount: number }> {
    const query: any = { recipientUserId: userId, readAt: null };
    
    if (!markAllAsRead && ids && ids.length > 0) {
      query._id = { $in: ids.filter(Types.ObjectId.isValid).map(id => new Types.ObjectId(id)) };
    }

    const result = await Notification.updateMany(query, { readAt: new Date() });
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete notification (user can only delete their own)
   */
  static async deleteNotification(id: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Notification.deleteOne({ _id: id, recipientUserId: userId });
    return result.deletedCount > 0;
  }

  /**
   * Get unread count for badge
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ recipientUserId: userId, readAt: null });
  }

  /**
   * Get or create user preferences
   */
  static async getOrCreatePreferences(userId: string) {
    let prefs = await NotificationPreference.findOne({ donorId: userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ donorId: userId });
    }
    return prefs;
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId: string, updates: any) {
    return NotificationPreference.findOneAndUpdate(
      { donorId: userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );
  }

  /**
   * Check if user has enabled a specific notification category
   */
  static async isCategoryEnabled(userId: string, category: 'sos' | 'appointment' | 'campaign'): Promise<boolean> {
    const prefs = await this.getOrCreatePreferences(userId);
    switch (category) {
      case 'sos': return prefs.sosEnabled && prefs.pushEnabled;
      case 'appointment': return prefs.appointmentEnabled;
      case 'campaign': return prefs.campaignEnabled;
      default: return false;
    }
  }

  /**
   * Get active template for event type and locale
   */
  static async getTemplate(eventType: string, locale = 'vi') {
    return NotificationTemplate.findOne({ eventType, locale, isActive: true }).lean();
  }

  /**
   * Send notification (internal use - called by domain events)
   */
  static async sendNotification(data: {
    recipientIds: string[];
    type: 'SOS' | 'Campaign' | 'Routine' | 'System';
    title: string;
    body: string;
    payload?: any;
    channels?: ('Email' | 'WebPush')[];
    templateId?: string;
    priority?: 'low' | 'normal' | 'high';
  }) {
    const channels = data.channels || ['WebPush'];
    const results = [];

    for (const recipientId of data.recipientIds) {
      // Check preferences for push/email channels
      const prefs = await this.getOrCreatePreferences(recipientId);
      const allowedChannels = channels.filter(c => {
        if (c === 'WebPush') return prefs.pushEnabled || prefs.sosEnabled;
        if (c === 'Email') return prefs.emailEnabled || prefs.appointmentEnabled || prefs.campaignEnabled;
        return true; 
      });

      if (allowedChannels.length === 0) continue;

      // Create notification record for each channel
      for (const channel of allowedChannels) {
        const notification = await Notification.create({
          recipientUserId: new Types.ObjectId(recipientId),
          type: data.type,
          channel: channel,
          title: data.title,
          body: data.body,
          payload: data.payload || {},
          sourceRefId: data.payload?.sourceRefId || new Types.ObjectId(),
          sourceRefType: data.payload?.sourceRefType || 'System',
          deliveryStatus: 'Pending',
        });

        await this.queueDelivery(notification._id.toString(), channel);
        results.push({ recipientUserId: recipientId, notificationId: notification._id, channel });
      }
    }

    return { success: true, sent: results.length, results };
  }

  /**
   * Queue notification for delivery via BullMQ
   */
  static async queueDelivery(notificationId: string, channel: 'Email' | 'WebPush') {
    // This will be implemented with BullMQ
    // For now, process synchronously
    await this.processDelivery(notificationId, channel);
  }

  /**
   * Process delivery for a specific channel
   */
  static async processDelivery(notificationId: string, channel: 'Email' | 'WebPush') {
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.channel !== channel) return;

    try {
      let success = false;
      notification.deliveryStatus = 'Sent';

      switch (channel) {
        case 'Email':
          success = await this.sendEmail(notification);
          break;
        case 'WebPush':
          success = await this.sendPush(notification);
          break;
      }

      if (success) {
        notification.deliveryStatus = 'Sent';
      } else {
        notification.deliveryStatus = 'Failed';
      }

      await notification.save();
    } catch (error) {
      notification.deliveryStatus = 'Failed';
      await notification.save();
    }
  }

  /**
   * Send email notification
   */
  static async sendEmail(notification: any): Promise<boolean> {
    try {
      const prefs = await NotificationPreference.findOne({ donorId: notification.recipientUserId });
      if (!prefs?.emailEnabled && !prefs?.campaignEnabled) return false;

      // Get user email
      const User = (await import('../../auth-account/models/User')).User;
      const user = await User.findById(notification.recipientUserId).select('email').lean();
      if (!user?.email) return false;

      await EmailService.send({
        to: user.email,
        subject: notification.title,
        html: this.renderEmailTemplate(notification),
        text: notification.body,
      });

      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  /**
   * Send push notification
   */
  static async sendPush(notification: any): Promise<boolean> {
    try {
      const prefs = await NotificationPreference.findOne({ donorId: notification.recipientUserId });
      if (!prefs?.pushEnabled && !prefs?.sosEnabled) return false;

      await PushService.send({
        userId: notification.recipientUserId.toString(),
        title: notification.title,
        body: notification.body,
        data: notification.payload,
      });

      return true;
    } catch (error) {
      console.error('Push send failed:', error);
      return false;
    }
  }

  /**
   * Render email template
   */
  static renderEmailTemplate(notification: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; border-radius: 12px; padding: 24px;">
          <h1 style="color: #93000b; margin-bottom: 16px;">${notification.title}</h1>
          <p style="font-size: 16px; color: #555;">${notification.body}</p>
          ${notification.payload?.deepLink ? `
            <div style="margin-top: 24px; text-align: center;">
              <a href="${notification.payload.deepLink}" style="display: inline-block; background: #93000b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Xem chi tiết</a>
            </div>
          ` : ''}
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Retry failed deliveries
   */
  static async retryFailedDeliveries() {
    const failedNotifications = await Notification.find({
      deliveryStatus: 'Failed'
    }).limit(100);

    for (const notification of failedNotifications) {
      notification.deliveryStatus = 'Retried';
      await notification.save();
      await this.queueDelivery(notification._id.toString(), notification.channel as 'Email' | 'WebPush');
    }
  }
}