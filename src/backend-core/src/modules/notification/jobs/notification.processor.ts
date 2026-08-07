import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../../config/redis.config';
import { QUEUES } from '../../../config/queue.config';
import { NotificationService } from '../services/notification.service';
import { NotificationChannel } from '../models/Notification';

export interface NotificationJobData {
  notificationId: string;
  channel: NotificationChannel;
}

export const notificationWorker = new Worker<NotificationJobData>(
  QUEUES.NOTIFICATION_DISPATCH,
  async (job: Job<NotificationJobData>) => {
    const { notificationId, channel } = job.data;
    
    console.log(`[NotificationWorker] Processing job ${job.id} for notification ${notificationId} via ${channel}`);
    
    try {
      // Call the existing processDelivery method
      await NotificationService.processDelivery(notificationId, channel);
      console.log(`[NotificationWorker] Successfully processed job ${job.id}`);
    } catch (error) {
      console.error(`[NotificationWorker] Failed to process job ${job.id}:`, error);
      throw error; // Will trigger BullMQ retry mechanism
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 notifications in parallel
  }
);

notificationWorker.on('failed', (job, err) => {
  console.error(`[NotificationWorker] Job ${job?.id} failed after ${job?.attemptsMade} attempts. Error:`, err);
});
