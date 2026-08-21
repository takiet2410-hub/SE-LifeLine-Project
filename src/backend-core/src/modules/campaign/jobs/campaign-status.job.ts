import { Campaign } from '../models/campaign.model';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const updateCampaignStatuses = async () => {
  try {
    const now = new Date();
    const startOfTomorrow = dayjs().tz('Asia/Ho_Chi_Minh').add(1, 'day').startOf('day').toDate();

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
