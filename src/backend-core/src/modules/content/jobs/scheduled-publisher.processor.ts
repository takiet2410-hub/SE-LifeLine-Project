import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../../config/redis.config';
import { QUEUES, scheduledTasksQueue } from '../../../config/queue.config';
import { ArticleService } from '../services/article.service';

export const scheduledPublisherWorker = new Worker(
  QUEUES.SCHEDULED_TASKS,
  async (job: Job) => {
    if (job.name === 'publish-articles') {
      try {
        const count = await ArticleService.publishScheduledArticles();
        if (count > 0) {
          console.log(`[ScheduledPublisherWorker] Auto-published ${count} scheduled article(s)`);
        }
      } catch (error) {
        console.error('[ScheduledPublisherWorker] Error processing scheduled articles:', error);
      }
    }
  },
  {
    connection: redisConnection,
  }
);

scheduledPublisherWorker.on('failed', (job, err) => {
  console.error(`[ScheduledPublisherWorker] Job ${job?.name} failed. Error:`, err);
});

// Setup the repeatable job
export const startScheduledPublisherJob = async () => {
  console.log('[ScheduledPublisherWorker] Initializing repeatable job for article publishing (every minute)');
  await scheduledTasksQueue.add(
    'publish-articles',
    {},
    {
      repeat: {
        pattern: '* * * * *', // Every minute
      },
      jobId: 'publish-articles-cron', // Prevent duplicates
    } as any
  );
};
