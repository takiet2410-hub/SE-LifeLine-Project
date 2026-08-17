import app from './app';
import { connectDB } from './utils/db.util';
import { env } from './config/env.config';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { initCampaignStatusJob } from './modules/campaign/jobs/campaign-status.job';
import { NotificationWorker } from './modules/notification/jobs/notification.worker';
import { startScheduledPublisherJob } from './modules/content/jobs/scheduled-publisher.processor';
import { SOSEvaluationWorker } from './modules/sos-request/jobs/sos-evaluation.worker';
import './modules/sos-request/jobs/sos-evaluation.processor';

import { runDatabaseSelfHealing } from './shared/database-repair.util';

process.on('uncaughtException', (err: any) => {
  console.error('[Server] Uncaught Exception caught (preventing crash):', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Server] Unhandled Rejection caught (preventing crash):', reason?.message || reason);
});

const startServer = async () => {
  try {
    await connectDB();
    await runDatabaseSelfHealing();
    await startScheduledPublisherJob();
  } catch (dbErr) {
    console.error('[Server] DB Connection warning:', dbErr);
  }
  
  try {
    initCampaignStatusJob();
  } catch (jobErr) {
    console.warn('[Server] Campaign status job warning:', jobErr);
  }

  try {
    NotificationWorker.start();
    SOSEvaluationWorker.start();
  } catch (workerErr) {
    console.warn('[Server] Notification worker warning:', workerErr);
  }

  app.listen(env.PORT, () => {
    console.log(`🚀 Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
};

startServer();

