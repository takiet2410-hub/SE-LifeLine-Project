import cron from 'node-cron';
import { SOSRequest } from '../models/sos-request.model';
import { SOSEvaluationService } from '../services/sos-evaluation.service';

// Run every 1 minute for easier testing
export const startSOSEvaluationJob = () => {
  cron.schedule('*/1 * * * *', async () => {
    console.log(`[SOS-CRON] Running scheduled SOS Request evaluation...`);
    try {
      // Find all requests that are Pending or EvaluationInProgress
      const pendingRequests = await SOSRequest.find({
        status: { $in: ['Pending', 'EvaluationInProgress'] }
      });
      
      console.log(`[SOS-CRON] Found ${pendingRequests.length} requests needing evaluation.`);

      for (const req of pendingRequests) {
        try {
          // Pass expandRadius = true to expand the search radius
          await SOSEvaluationService.evaluateAndPrioritize(req._id.toString(), true);
        } catch (err) {
          console.error(`[SOS-CRON] Failed to evaluate request ${req._id}:`, err);
        }
      }
    } catch (error) {
      console.error(`[SOS-CRON] Job failed:`, error);
    }
  });
};
