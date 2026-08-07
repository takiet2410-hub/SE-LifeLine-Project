import cron from 'node-cron';
import { Notification } from '../models/Notification';
import { NotificationService } from '../services/notification.service';

/**
 * Background worker to process pending notifications.
 * Uses a basic MongoDB polling mechanism.
 */
export class NotificationWorker {
  private static isRunning = false;

  public static start() {
    console.log('[NotificationWorker] Starting background notification processor...');

    // Run every 30 seconds (was every 10 seconds - too aggressive)
    cron.schedule('*/30 * * * * *', async () => {
      if (this.isRunning) return; // Prevent overlapping runs
      this.isRunning = true;

      try {
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
}
