import cron from 'node-cron';
import { SOSRequest } from '../models/sos-request.model';
import { SOSEvaluationService } from '../services/sos-evaluation.service';
import { sosEvaluationQueue } from '../../../config/queue.config';

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
          $expr: {
            $lt: [
              { $add: [
                { $ifNull: ['$pledgedQuantityMl', 0] },
                { $ifNull: ['$inTransitQuantityMl', 0] },
                { $ifNull: ['$receivedQuantityMl', 0] }
              ] },
              '$requiredQuantityMl'
            ]
          }
        });

        if (stalledRequests.length > 0) {
          let queuedCount = 0;

          for (const req of stalledRequests) {
            try {
              const requestId = req._id.toString();
              const radiusState = await SOSEvaluationService.getRadiusExpansionState(requestId);
              if (!radiusState.canExpand) continue;

              await sosEvaluationQueue.add('re-evaluate', {
                sosRequestId: requestId,
                expandRadius: true,
              }, {
                jobId: `reval-${requestId}-${radiusState.lastRadiusKm}`,
              });
              queuedCount += 1;
            } catch (err) {
              console.error(`[SOSEvaluationWorker] Error queueing request ${req._id}:`, err);
            }
          }

          if (queuedCount > 0) {
            console.log(`[SOSEvaluationWorker] Queued ${queuedCount} bounded radius expansion job(s).`);
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
