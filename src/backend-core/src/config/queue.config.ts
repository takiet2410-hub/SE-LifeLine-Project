import { Queue } from 'bullmq';
import { redisConnection } from './redis.config';

export const QUEUES = {
  SOS_EVALUATION: 'sos-evaluation',
  NOTIFICATION_DISPATCH: 'notification-dispatch',
  SCHEDULED_TASKS: 'scheduled-tasks',
};

// 1. SOS Evaluation Queue - High Priority
export const sosEvaluationQueue = new Queue(QUEUES.SOS_EVALUATION, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// 2. Notification Dispatch Queue
export const notificationQueue = new Queue(QUEUES.NOTIFICATION_DISPATCH, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // wait 2s before first retry
    },
    removeOnComplete: true,
    removeOnFail: 100, // keep last 100 failed jobs for debugging
  },
});

// 3. Scheduled Tasks Queue (Cron-like)
export const scheduledTasksQueue = new Queue(QUEUES.SCHEDULED_TASKS, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});
