import { Campaign } from '../models/campaign.model';

export const updateCampaignStatuses = async () => {
  try {
    const now = new Date();

    // 1. Transition to Upcoming: startDateTime in the future and status not in Draft/Cancled/Cancelled
    await Campaign.updateMany(
      {
        status: { $nin: ['Draft', 'Cancelled'] },
        startDateTime: { $gt: now }
      },
      { $set: { status: 'Upcoming' } }
    );

    // 2. Transition to Active: startDateTime <= now <= endDateTime and status not in Draft/Cancled/Cancelled
    await Campaign.updateMany(
      {
        status: { $nin: ['Draft', 'Cancelled'] },
        startDateTime: { $lte: now },
        endDateTime: { $gte: now }
      },
      { $set: { status: 'Active' } }
    );

    // 3. Transition to Completed: endDateTime < now and status not in Draft/Cancled/Cancelled
    await Campaign.updateMany(
      {
        status: { $nin: ['Draft', 'Cancelled'] },
        endDateTime: { $lt: now }
      },
      { $set: { status: 'Completed' } }
    );
  } catch (err) {
    console.error('[CampaignStatusJob] Error updating campaign statuses:', err);
  }
};

export const initCampaignStatusJob = () => {
  // Run immediately on server start
  updateCampaignStatuses();

  // Run periodically every 1 minute
  setInterval(() => {
    updateCampaignStatuses();
  }, 60 * 1000);

  console.log('⏰ [CampaignStatusJob] Initialized auto status update timer (interval: 60s)');
};
