import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../../config/redis.config';
import { QUEUES, sosEvaluationQueue } from '../../../config/queue.config';
import { SOSEvaluationService } from '../services/sos-evaluation.service';
import { SOSRequest } from '../models/sos-request.model';

export interface SOSEvaluationJobData {
  sosRequestId: string;
  expandRadius?: boolean;
}

export const sosEvaluationWorker = new Worker<SOSEvaluationJobData>(
  QUEUES.SOS_EVALUATION,
  async (job: Job<SOSEvaluationJobData>) => {
    const { sosRequestId, expandRadius } = job.data;
    
    console.log(`[SOSEvaluationWorker] Processing job ${job.id} for SOS Request ${sosRequestId} (expandRadius: ${expandRadius || false})`);
    
    try {
      // Check if request is still active
      const request = await SOSRequest.findById(sosRequestId);
      if (!request || !['Pending', 'EvaluationInProgress', 'NotificationsDispatched'].includes(request.status)) {
        console.log(`[SOSEvaluationWorker] SOS Request ${sosRequestId} is no longer active (status: ${request?.status}). Skipping evaluation.`);
        return;
      }
      
      // If past deadline, expire it
      if (new Date() >= new Date(request.fulfillmentDeadline)) {
        console.log(`[SOSEvaluationWorker] SOS Request ${sosRequestId} is past deadline. Expiring.`);
        request.status = 'Expired';
        await request.save();
        return;
      }

      // Perform evaluation and broadcast
      await SOSEvaluationService.evaluateAndPrioritize(sosRequestId, expandRadius);
      
      // If it's still not fulfilled, schedule a re-evaluation to expand radius in 5 minutes
      const updatedRequest = await SOSRequest.findById(sosRequestId);
      if (updatedRequest && (updatedRequest.collectedQuantityMl || 0) < updatedRequest.requiredQuantityMl) {
        console.log(`[SOSEvaluationWorker] SOS Request ${sosRequestId} still not fulfilled. Scheduling radius expansion in 5 minutes.`);
        await sosEvaluationQueue.add('re-evaluate', {
          sosRequestId,
          expandRadius: true
        }, {
          delay: 5 * 60 * 1000, // 5 minutes
          jobId: `reval-${sosRequestId}-${Date.now()}` // Unique ID
        });
      }
      
      console.log(`[SOSEvaluationWorker] Successfully processed job ${job.id}`);
    } catch (error) {
      console.error(`[SOSEvaluationWorker] Failed to process job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // High CPU task, limit concurrency
    drainDelay: 30, // Poll every 30s instead of 5s to save Upstash Redis commands
    stalledInterval: 300000, // Check stalled jobs every 5 minutes
  }
);

sosEvaluationWorker.on('failed', (job, err) => {
  console.error(`[SOSEvaluationWorker] Job ${job?.id} failed. Error:`, err);
});
