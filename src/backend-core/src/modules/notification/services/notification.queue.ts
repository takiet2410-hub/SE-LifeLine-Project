import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { NotificationService } from './notification.service';
import { Notification, IDeliveryStatus } from '../models/Notification';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

export const notificationQueue = new Queue('notification-delivery', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const notificationWorker = new Worker('notification-delivery', async (job: Job) => {
  const { notificationId, channel } = job.data;
  
  try {
    await NotificationService.processDelivery(notificationId, channel);
  } catch (error) {
    console.error(`[Worker] Delivery failed for ${notificationId} via ${channel}:`, error);
    throw error; // Will trigger retry
  }
}, {
  connection,
  concurrency: 10,
});

notificationWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed for ${job.data.channel}`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

// Retry failed deliveries job (runs every 5 minutes)
export async function startRetryJob() {
  setInterval(async () => {
    try {
      await NotificationService.retryFailedDeliveries();
    } catch (error) {
      console.error('[RetryJob] Failed to retry deliveries:', error);
    }
  }, 5 * 60 * 1000);
}

export async function queueNotificationDelivery(notificationId: string, channel: 'in-app' | 'email' | 'push') {
  await notificationQueue.add('deliver', { notificationId, channel }, {
    priority: channel === 'in-app' ? 10 : channel === 'push' ? 5 : 1,
  });
}

export async function queueBulkDelivery(notificationIds: string[], channel: 'in-app' | 'email' | 'push') {
  const jobs = notificationIds.map(id => ({
    name: 'deliver',
    data: { notificationId: id, channel },
    opts: { priority: channel === 'in-app' ? 10 : channel === 'push' ? 5 : 1 },
  }));
  
  await notificationQueue.addBulk(jobs);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await notificationWorker.close();
  await notificationQueue.close();
  await connection.quit();
});