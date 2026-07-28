import { ArticleService } from '../services/article.service';

export const startScheduledPublisherJob = (intervalMs = 60000) => {
  console.log('[ScheduledPublisherJob] Initialized article auto-publish timer (interval: 60s)');
  
  const checkAndPublish = async () => {
    try {
      const count = await ArticleService.publishScheduledArticles();
      if (count > 0) {
        console.log(`[ScheduledPublisherJob] Auto-published ${count} scheduled article(s)`);
      }
    } catch (error) {
      console.error('[ScheduledPublisherJob] Error processing scheduled articles:', error);
    }
  };

  // Run immediately on start
  checkAndPublish();

  // Run periodically
  return setInterval(checkAndPublish, intervalMs);
};
