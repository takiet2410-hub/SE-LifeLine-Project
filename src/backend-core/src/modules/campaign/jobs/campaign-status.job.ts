import { Campaign } from '../models/campaign.model';

export const updateCampaignStatuses = async () => {
  try {
    const now = new Date();
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

    // 1. Transition to Upcoming: start date is in the future (tomorrow or later) and status not in Draft/Cancelled
    await Campaign.updateMany(
      {
        status: { $nin: ['Draft', 'Cancelled'] },
        startDateTime: { $gte: startOfTomorrow }
      },
      { $set: { status: 'Upcoming' } }
    );

    // 2. Transition to Active: start date has arrived (today or earlier) and endDateTime >= now and status not in Draft/Cancelled
    await Campaign.updateMany(
      {
        status: { $nin: ['Draft', 'Cancelled'] },
        startDateTime: { $lt: startOfTomorrow },
        endDateTime: { $gte: now }
      },
      { $set: { status: 'Active' } }
    );

    // 3. Transition to Completed: endDateTime < now and status not in Draft/Cancelled
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
