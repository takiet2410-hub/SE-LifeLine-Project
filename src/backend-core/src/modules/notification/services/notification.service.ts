import mongoose, { Types } from 'mongoose';
import { Notification, INotification, DeliveryStatus } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { EmailService } from './email.service';
import { PushService } from './push.service';
import { isFeatureEnabled } from '../../admin/services/admin-toggle.service';

export interface NotificationFilters {
  page: number;
  limit: number;
  type?: string;
  status?: string;
  channel?: string;
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
  private static applyAudienceGuard(activeRole: string | undefined, query: Record<string, any>): void {
    if (!activeRole) return;

    if (activeRole === 'Donor') {
      // In Donor portal: exclude management-specific notifications
      query.$nor = [
        { 'payload.audienceRole': { $in: ['BloodCenterStaff', 'HospitalStaff', 'Administrator'] } },
        { 'payload.deepLink': /^(?:https?:\/\/[^\/]+)?(?:\/bc|\/hospital|\/admin)(?:\/|$)/ },
      ];
    } else {
      // In Staff/Admin portals (BloodCenterStaff, HospitalStaff, Administrator):
      // Exclude donor-specific notifications (personal donations, screening results, appointments, donor SOS alerts)
      query.$nor = [
        { 'payload.audienceRole': 'Donor' },
        { 'payload.deepLink': /^(?:https?:\/\/[^\/]+)?(?:\/donor|\/my-appointments|\/profile|\/sos-alerts)(?:\/|$)/ },
        { title: { $regex: /kết quả hiến máu|kết quả xét nghiệm|cảm ơn bạn đã hiến máu|lịch hẹn|đặt hẹn|đủ điều kiện hiến máu|hồ sơ cá nhân|huy hiệu/i } },
        { body: { $regex: /xét nghiệm mẫu máu|tinh thần thiện nguyện của bạn|cảm ơn bạn đã hiến máu thành công/i } },
        { 'payload.appointmentId': { $exists: true } },
        { 'payload.nextEligibleDate': { $exists: true } },
      ];
    }
  }

  private static escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private static isWithinQuietHours(start: string | null, end: string | null, timezone: string): boolean {
    if (!start || !end || start === end) return false;
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone || 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(new Date());
      const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
      const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
      const toMinutes = (value: string) => {
        const [h, m] = value.split(':').map(Number);
        return h * 60 + m;
      };
      const now = hour * 60 + minute;
      const startMinutes = toMinutes(start);
      const endMinutes = toMinutes(end);
      return startMinutes < endMinutes
        ? now >= startMinutes && now < endMinutes
        : now >= startMinutes || now < endMinutes;
    } catch {
      return false;
    }
  }

  private static async attachLiveSOSState<T extends Record<string, any>>(notifications: T[]): Promise<T[]> {
    const sosIds = notifications
      .filter((item) => item.type === 'SOS' && item.sourceRefType === 'SOSRequest' && Types.ObjectId.isValid(item.sourceRefId))
      .map((item) => item.sourceRefId);
    if (sosIds.length === 0) return notifications;

    const { SOSRequest } = await import('../../sos-request/models/sos-request.model');
    const requests = await SOSRequest.find({ _id: { $in: sosIds } })
      .select('status fulfillmentDeadline pledgedQuantityMl collectedQuantityMl inTransitQuantityMl receivedQuantityMl requiredQuantityMl')
      .lean();
    const byId = new Map(requests.map((request: any) => [request._id.toString(), request]));

    return notifications.map((item) => {
      const request = byId.get(item.sourceRefId?.toString());
      if (!request) return item;
      const payload = {
        ...(item.payload || {}),
        status: request.status,
        fulfillmentDeadline: request.fulfillmentDeadline,
        pledgedQuantityMl: request.pledgedQuantityMl || 0,
        collectedQuantityMl: request.collectedQuantityMl || 0,
        inTransitQuantityMl: request.inTransitQuantityMl || 0,
        receivedQuantityMl: request.receivedQuantityMl || 0,
        requiredQuantityMl: request.requiredQuantityMl,
      };
      return { ...item, payload, sosRequestInfo: payload };
    });
  }

  /**
   * Get user notifications with pagination and filters
   */
  static async getUserNotifications(
    userId: string,
    filters: NotificationFilters,
    activeRole?: string
  ): Promise<PaginatedResult<INotification>> {
    const { page, limit, type, status, channel, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const userFilter = Types.ObjectId.isValid(userId) ? { $in: [userId, new Types.ObjectId(userId)] } : userId;
    const query: any = { recipientUserId: userFilter };
    this.applyAudienceGuard(activeRole, query);

    // Default UI channel filter to InApp to prevent showing duplicate WebPush + InApp entries
    if (channel && channel !== 'all') {
      query.channel = channel;
    } else if (!channel) {
      query.channel = 'InApp';
    }

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

    const hydratedNotifications = await this.attachLiveSOSState(notifications as any[]);
    return {
      data: hydratedNotifications as any,
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
    const userFilter = Types.ObjectId.isValid(userId) ? { $in: [userId, new Types.ObjectId(userId)] } : userId;
    const idFilter = Types.ObjectId.isValid(id) ? { $in: [id, new Types.ObjectId(id)] } : id;
    const notification = await Notification.findOne({ _id: idFilter, recipientUserId: userFilter }).lean();
    if (!notification) return null;
    const [hydrated] = await this.attachLiveSOSState([notification as any]);
    return hydrated as any;
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(id: string, userId: string): Promise<INotification | null> {
    const userFilter = Types.ObjectId.isValid(userId) ? { $in: [userId, new Types.ObjectId(userId)] } : userId;
    const idFilter = Types.ObjectId.isValid(id) ? { $in: [id, new Types.ObjectId(id)] } : id;

    const notif = await Notification.findOne({ _id: idFilter, recipientUserId: userFilter });
    if (!notif) return null;

    const now = new Date();
    await Notification.updateMany(
      {
        recipientUserId: notif.recipientUserId,
        $or: [
          { _id: notif._id },
          { sourceRefId: notif.sourceRefId, sourceRefType: notif.sourceRefType }
        ]
      },
      { readAt: now }
    );

    notif.readAt = now;
    return notif;
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(
    userId: string,
    ids?: string[],
    markAllAsRead = false,
    activeRole?: string
  ): Promise<{ modifiedCount: number }> {
    const userFilter = Types.ObjectId.isValid(userId) ? { $in: [userId, new Types.ObjectId(userId)] } : userId;
    const query: any = { recipientUserId: userFilter, readAt: null };
    this.applyAudienceGuard(activeRole, query);

    if (!markAllAsRead && ids && ids.length > 0) {
      const idFilters = ids.flatMap(id => Types.ObjectId.isValid(id) ? [id, new Types.ObjectId(id)] : [id]);
      query._id = { $in: idFilters };
    }

    const result = await Notification.updateMany(query, { readAt: new Date() });
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Queue notification for background processing using BullMQ
   */
  static async queueDelivery(
    notificationId: string,
    channels: import('../models/Notification').NotificationChannel[],
    isRetry = false
  ): Promise<void> {
    try {
      const { notificationQueue } = await import('../../../config/queue.config');
      if (isRetry) {
        for (const channel of channels) {
          const legacyJob = await notificationQueue.getJob(`${notificationId}-${channel}`);
          if (legacyJob && await legacyJob.isFailed()) await legacyJob.remove();
        }
      }

      const jobs = channels.map(channel => ({
        name: `deliver-${channel}`,
        data: { notificationId, channel },
        opts: {
          jobId: isRetry ? `${notificationId}-${channel}-retry-${Date.now()}` : `${notificationId}-${channel}`,
        }
      }));

      await notificationQueue.addBulk(jobs);
      console.log(`[NotificationService] Queued ${channels.length} delivery jobs for notification ${notificationId}`);
    } catch (error) {
      console.error('[NotificationService] Failed to queue delivery:', error);
      throw error;
    }
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
  static async getUnreadCount(userId: string, activeRole?: string): Promise<number> {
    const userFilter = Types.ObjectId.isValid(userId) ? { $in: [userId, new Types.ObjectId(userId)] } : userId;
    const query: any = { recipientUserId: userFilter, readAt: null, channel: 'InApp' };
    this.applyAudienceGuard(activeRole, query);
    return Notification.countDocuments(query);
  }

  /**
   * Get or create user preferences
   */
  static async getOrCreatePreferences(userId: string) {
    let prefs = await NotificationPreference.findOne({ userId }).sort({ updatedAt: -1 });
    if (!prefs) {
      try {
        prefs = await NotificationPreference.create({ userId });
      } catch (error: any) {
        if (error.code === 11000 && error.message.includes('donorId_1')) {
          console.log('[NotificationService] Found legacy donorId_1 index causing E11000. Dropping it...');
          try {
            await mongoose.connection.db?.collection('notification_preferences').dropIndex('donorId_1');
          } catch (e) { }
          prefs = await NotificationPreference.create({ userId });
        } else if (error.code === 11000) {
          // If another worker created it concurrently, just fetch it
          prefs = await NotificationPreference.findOne({ userId });
        } else {
          throw error;
        }
      }
    }
    return prefs;
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId: string, updates: any) {
    const latest = await NotificationPreference.findOne({ userId }).sort({ updatedAt: -1 });
    if (!latest) {
      return NotificationPreference.findOneAndUpdate(
        { userId },
        { $set: updates },
        { returnDocument: 'after', upsert: true, runValidators: true }
      );
    }
    latest.set(updates);
    await latest.save();
    await NotificationPreference.deleteMany({ userId, _id: { $ne: latest._id } });
    return latest;
  }

  /**
   * Check if user has enabled a specific notification category
   */
  static async isCategoryEnabled(userId: string, category: 'sos' | 'appointment' | 'campaign'): Promise<boolean> {
    const prefs = await this.getOrCreatePreferences(userId);
    switch (category) {
      case 'sos': return prefs!.sosEnabled && prefs!.pushEnabled;
      case 'appointment': return prefs!.appointmentEnabled && prefs!.pushEnabled;
      case 'campaign': return prefs!.campaignEnabled && prefs!.pushEnabled;
      default: return false;
    }
  }

  /**
   * Get active template for event type and locale
   */
  static async getTemplate(eventType: string, locale = 'vi') {
    return NotificationTemplate.findOne({ eventType: eventType as any, locale, isActive: true }).lean();
  }

  /**
   * Send notification (internal use - called by domain events)
   */
  static async sendNotification(data: {
    recipientIds: string[];
    type: import('../models/Notification').NotificationType;
    title: string;
    body: string;
    payload?: any;
    channels?: ('Email' | 'WebPush' | 'InApp')[];
    templateId?: string;
    priority?: 'low' | 'normal' | 'high';
    allowedRecipientRoles?: ('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[];
  }) {
    if (data.type === 'SOS' && !(await isFeatureEnabled('sos_emergency_alerts'))) {
      return { success: false, sent: 0, results: [], skippedReason: 'FEATURE_DISABLED' };
    }

    const channels = data.channels || ['WebPush'];
    const results = [];
    let recipientIds = Array.from(new Set(data.recipientIds.map(String)));

    // Enforce the audience at the final delivery boundary as defense in depth.
    // Donor is a mandatory base role, so multi-role users are eligible when
    // they use the Donor portal; management portals filter this audience out.
    if (data.allowedRecipientRoles?.length && recipientIds.length > 0) {
      const { User } = await import('../../auth-account/models/user.model');
      const validIds = recipientIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      const roleFilter: Record<string, any> = data.allowedRecipientRoles.includes('Donor')
        ? { $or: [{ role: 'Donor' }, { roles: 'Donor' }] }
        : { role: { $in: data.allowedRecipientRoles } };
      const eligibleUsers = await User.find({
        _id: { $in: validIds },
        ...roleFilter,
        accountStatus: 'Active',
        isDeleted: { $ne: true },
      }).select('_id').lean();
      const eligibleIds = new Set(eligibleUsers.map((user: any) => user._id.toString()));
      recipientIds = recipientIds.filter((id) => eligibleIds.has(id));
    }

    for (const recipientId of recipientIds) {
      // Check preferences for push/email channels
      const prefs = await this.getOrCreatePreferences(recipientId);
      if (!prefs) continue; // Should never happen, but satisfies TypeScript
      const quietHoursActive = data.type !== 'SOS' && this.isWithinQuietHours(
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
        prefs.timezone
      );
      const allowedChannels = channels.filter(c => {
        if (quietHoursActive && c !== 'InApp') return false;
        if (c === 'WebPush') {
          if (data.type === 'SOS') return prefs.sosEnabled && prefs.pushEnabled;
          if (data.type === 'Campaign') return prefs.campaignEnabled && prefs.pushEnabled;
          if (data.type === 'Appointment') return prefs.appointmentEnabled && prefs.pushEnabled;
          return prefs.pushEnabled;
        }
        if (c === 'Email') {
          if (data.type === 'SOS') return prefs.sosEnabled && prefs.emailEnabled;
          if (data.type === 'Campaign') return prefs.campaignEnabled && prefs.emailEnabled;
          if (data.type === 'Appointment') return prefs.appointmentEnabled && prefs.emailEnabled;
          return prefs.emailEnabled;
        }
        return true;
      });

      if (allowedChannels.length === 0) continue;

      // Create notification record for each channel
      for (const channel of allowedChannels) {
        const sourceRefId = data.payload?.sourceRefId || new Types.ObjectId();
        const sourceRefType = data.payload?.sourceRefType || 'System';
        const duplicateCutoff = new Date(Date.now() - 5 * 60 * 1000);
        const recentDuplicate = data.payload?.sourceRefId
          ? await Notification.findOne({
            recipientUserId: new Types.ObjectId(recipientId),
            channel,
            sourceRefId,
            sourceRefType,
            title: data.title,
            body: data.body,
            createdAt: { $gte: duplicateCutoff },
          }).lean()
          : null;
        if (recentDuplicate) {
          results.push({ recipientUserId: recipientId, notificationId: recentDuplicate._id, channel, deduplicated: true });
          continue;
        }

        const notification = await Notification.create({
          recipientUserId: new Types.ObjectId(recipientId),
          type: data.type,
          channel: channel,
          title: data.title,
          body: data.body,
          payload: data.payload || {},
          sourceRefId,
          sourceRefType,
          deliveryStatus: 'Pending',
        });

        const notifIdStr = notification._id.toString();
        await this.queueDelivery(notifIdStr, [channel]);

        // Immediate background dispatch (ensures instant delivery without waiting for queue worker drain)
        this.processDelivery(notifIdStr, channel).catch(err => {
          console.warn(`[NotificationService] Immediate delivery fallback notice for ${notifIdStr}:`, err?.message || err);
        });

        results.push({ recipientUserId: recipientId, notificationId: notification._id, channel });
      }
    }

    return { success: true, sent: results.length, results };
  }



  /**
   * Process delivery for a specific channel with atomic lock to prevent duplicate sends
   */
  static async processDelivery(notificationId: string, channel: import('../models/Notification').NotificationChannel) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        channel: channel,
        deliveryStatus: { $in: ['Pending', 'Failed'] }
      },
      {
        $set: { deliveryStatus: 'Sending' }
      },
      { new: true }
    );

    if (!notification) return;

    try {
      let success = false;

      switch (channel) {
        case 'Email':
          success = await this.sendEmail(notification);
          break;
        case 'WebPush':
          success = await this.sendPush(notification);
          break;
        case 'InApp':
          success = true; // InApp doesn't need external delivery
          break;
      }

      if (success) {
        notification.deliveryStatus = 'Sent';
        await notification.save();
      } else {
        notification.deliveryStatus = 'Failed';
        await notification.save();
      }
    } catch (err: any) {
      notification.deliveryStatus = 'Failed';
      await notification.save();
      throw err;
    }
  }

  /**
   * Send email notification
   */
  static async sendEmail(notification: any): Promise<boolean> {
    try {
      const prefs = await NotificationPreference.findOne({ userId: notification.recipientUserId });
      let allowed = false;
      if (prefs) {
        if (notification.type === 'SOS') allowed = prefs.emailEnabled && prefs.sosEnabled;
        else if (notification.type === 'Campaign') allowed = prefs.emailEnabled && prefs.campaignEnabled;
        else if (notification.type === 'Appointment') allowed = prefs.emailEnabled && prefs.appointmentEnabled;
        else allowed = prefs.emailEnabled;
      }
      if (!allowed) return false;

      // Get user email
      const User = (await import('../../auth-account/models/user.model')).User;
      const user = await User.findById(notification.recipientUserId).select('email').lean();
      if (!user?.email) return false;

      return await EmailService.send({
        to: user.email,
        subject: notification.title,
        html: this.renderEmailTemplate(notification),
        text: notification.body,
      });
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
      const prefs = await NotificationPreference.findOne({ userId: notification.recipientUserId });
      let allowed = false;
      if (prefs) {
        if (notification.type === 'SOS') allowed = prefs.pushEnabled && prefs.sosEnabled;
        else if (notification.type === 'Campaign') allowed = prefs.pushEnabled && prefs.campaignEnabled;
        else if (notification.type === 'Appointment') allowed = prefs.pushEnabled && prefs.appointmentEnabled;
        else allowed = prefs.pushEnabled;
      }
      if (!allowed) return false;

      return await PushService.send({
        userId: notification.recipientUserId.toString(),
        title: notification.title,
        body: notification.body,
        data: notification.payload,
      });
    } catch (error) {
      console.error('Push send failed:', error);
      return false;
    }
  }

  /**
   * Render email template
   */
  static renderEmailTemplate(notification: any): string {
    const title = this.escapeHtml(notification.title);
    const body = this.escapeHtml(notification.body).replace(/\n/g, '<br>');
    const rawDeepLink = String(notification.payload?.deepLink || '');
    const deepLink = /^(https?:\/\/|\/)/i.test(rawDeepLink) ? this.escapeHtml(rawDeepLink) : '';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; border-radius: 12px; padding: 24px;">
          <h1 style="color: #93000b; margin-bottom: 16px;">${title}</h1>
          <p style="font-size: 16px; color: #555;">${body}</p>
          ${deepLink ? `
            <div style="margin-top: 24px; text-align: center;">
              <a href="${deepLink}" style="display: inline-block; background: #93000b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Xem chi tiết</a>
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
      deliveryStatus: 'Failed',
      retryCount: { $lt: 3 },
    }).limit(100);

    for (const notification of failedNotifications) {
      notification.deliveryStatus = 'Pending';
      notification.retryCount = (notification.retryCount || 0) + 1;
      await notification.save();
      await this.queueDelivery(notification._id.toString(), [notification.channel as any], true);
    }
  }
}
