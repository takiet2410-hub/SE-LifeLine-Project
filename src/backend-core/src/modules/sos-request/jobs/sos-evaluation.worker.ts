import cron from 'node-cron';
import { SOSRequest } from '../models/sos-request.model';
import { SOSEvaluationService } from '../services/sos-evaluation.service';

/**
 * Background worker to:
 * 1. Auto-expire SOS Requests past their fulfillmentDeadline
 * 2. Automatically expand the search radius for stalled SOS Requests
 */
export class SOSEvaluationWorker {
  private static isRunning = false;

  public static start() {
    console.log('[SOSEvaluationWorker] Starting Auto-Radius Expansion & Auto-Expire worker...');

    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      if (this.isRunning) return;
      this.isRunning = true;

      try {
        const now = new Date();

        // --- Task 1: Auto-Expire overdue SOS Requests ---
        const expiredResult = await SOSRequest.updateMany(
          {
            status: { $in: ['Pending', 'EvaluationInProgress', 'NotificationsDispatched'] },
            fulfillmentDeadline: { $lt: now },
          },
          { $set: { status: 'Expired' } }
        );

        if (expiredResult.modifiedCount > 0) {
          console.log(`[SOSEvaluationWorker] Auto-expired ${expiredResult.modifiedCount} overdue SOS Request(s).`);
        }

        // --- Task 2: Auto-Radius Expansion for stalled requests ---
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

        const stalledRequests = await SOSRequest.find({
          status: { $in: ['Pending', 'NotificationsDispatched', 'EvaluationInProgress'] },
          // Note: InventoryDispatched is excluded — blood is on the way, stop re-broadcasting
          fulfillmentDeadline: { $gte: now }, // not expired
          createdAt: { $lt: fiveMinsAgo },    // created more than 5 min ago
          $expr: { $lt: ['$collectedQuantityMl', '$requiredQuantityMl'] }
        });

        if (stalledRequests.length > 0) {
          console.log(`[SOSEvaluationWorker] Found ${stalledRequests.length} stalled SOS Request(s). Triggering re-evaluation to expand radius.`);

          for (const req of stalledRequests) {
            try {
              await SOSEvaluationService.evaluateAndPrioritize(req._id.toString(), true);
            } catch (err) {
              console.error(`[SOSEvaluationWorker] Error re-evaluating request ${req._id}:`, err);
            }
          }
        }
      } catch (error) {
        console.error('[SOSEvaluationWorker] Error in worker cycle:', error);
      } finally {
        this.isRunning = false;
      }
    });
  }
}
