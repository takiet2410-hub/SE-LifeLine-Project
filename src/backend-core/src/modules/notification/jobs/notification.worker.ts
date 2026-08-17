import cron from 'node-cron';
import { Notification } from '../models/Notification';
import { NotificationService } from '../services/notification.service';
import { Appointment, AppointmentStatus } from '../../booking/models/appointment.model';
import { SystemConfig } from '../../admin/models/system-config.model';

/**
 * Background worker to process pending notifications.
 * Uses a basic MongoDB polling mechanism.
 */
export class NotificationWorker {
  private static isRunning = false;
  private static lastRetryAt = 0;

  public static start() {
    console.log('[NotificationWorker] Starting background notification processor...');

    // Run every 30 seconds (was every 10 seconds - too aggressive)
    cron.schedule('*/30 * * * * *', async () => {
      if (this.isRunning) return; // Prevent overlapping runs
      this.isRunning = true;

      try {
        await this.enqueueAppointmentReminders();

        if (Date.now() - this.lastRetryAt >= 5 * 60 * 1000) {
          this.lastRetryAt = Date.now();
          await NotificationService.retryFailedDeliveries();
        }

        // Find up to 100 pending notifications (increased batch size)
        const pendingNotifications = await Notification.find({ deliveryStatus: 'Pending' })
          .sort({ createdAt: 1 })
          .limit(100);

        if (pendingNotifications.length > 0) {
          console.log(`[NotificationWorker] Processing ${pendingNotifications.length} pending notifications...`);
          
          const promises = pendingNotifications.map(notif => 
            NotificationService.processDelivery(notif._id.toString(), notif.channel)
          );

          // Wait for all to finish (they handle their own errors internally)
          await Promise.allSettled(promises);
          
          console.log(`[NotificationWorker] Batch completed.`);
        }
      } catch (error) {
        console.error('[NotificationWorker] Error processing batch:', error);
      } finally {
        this.isRunning = false;
      }
    });
  }

  private static async enqueueAppointmentReminders() {
    const reminderConfig = await SystemConfig.findOne({ key: 'appointmentReminderHours' }).lean();
    const reminderHours = typeof reminderConfig?.value === 'number' ? reminderConfig.value : 24;
    const now = new Date();
    const cutoff = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);
    const queryStart = new Date(now);
    queryStart.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      status: { $in: [AppointmentStatus.Confirmed, AppointmentStatus.Scheduled] },
      appointmentDate: { $gte: queryStart, $lte: cutoff },
    }).populate('campaignId', 'name venue fullAddress').lean();

    for (const appointment of appointments as any[]) {
      const appointmentTime = new Date(appointment.appointmentDate);
      const slotStart = String(appointment.timeSlot || '').split('-')[0].trim();
      const [hour, minute] = slotStart.split(':').map(Number);
      if (Number.isInteger(hour) && Number.isInteger(minute)) {
        appointmentTime.setHours(hour, minute, 0, 0);
      }
      if (appointmentTime <= now || appointmentTime > cutoff) continue;

      const alreadyQueued = await Notification.exists({
        recipientUserId: appointment.donorId,
        sourceRefId: appointment._id,
        sourceRefType: 'Appointment',
        'payload.reminderHours': reminderHours,
      });
      if (alreadyQueued) continue;

      const campaign = appointment.campaignId || {};
      await NotificationService.sendNotification({
        recipientIds: [appointment.donorId.toString()],
        type: 'Appointment',
        title: `Nhắc lịch hiến máu trong ${reminderHours} giờ tới`,
        body: `Bạn có lịch hiến máu tại ${campaign.name || campaign.venue || 'điểm hiến máu LifeLine'} lúc ${slotStart || 'theo lịch đã đăng ký'}. Vui lòng đến đúng giờ và mang theo giấy tờ tùy thân.`,
        payload: {
          sourceRefId: appointment._id,
          sourceRefType: 'Appointment',
          appointmentId: appointment._id.toString(),
          reminderHours,
          deepLink: `/my-appointments/${appointment._id.toString()}`,
        },
        channels: ['InApp', 'WebPush', 'Email'],
      });
    }
  }
}
