import { Campaign, ICampaign } from '../models/campaign.model';
import { Appointment } from '../../booking/models/appointment.model';

export class CampaignService {
  /**
   * BC-UC-01: View Campaign List
   * Paginated, filterable by location, date range, status, and sortable.
   */
  public static async listCampaigns(query: any) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, parseInt(query.limit || '10', 10));
    const skip = (page - 1) * limit;

    const filterQuery: any = {};

    // Filter by location / search keyword (venue, fullAddress, or name)
    if (query.location && query.location.trim() !== '') {
      const searchRegex = new RegExp(query.location.trim(), 'i');
      filterQuery.$or = [
        { venue: searchRegex },
        { fullAddress: searchRegex },
        { name: searchRegex }
      ];
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      filterQuery.startDateTime = {};
      if (query.startDate) {
        filterQuery.startDateTime.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const nextDay = new Date(query.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        filterQuery.startDateTime.$lte = nextDay;
      }
    }

    // Filter by status
    if (query.status && query.status.trim() !== '') {
      filterQuery.status = query.status.trim();
    }

    // Sort options
    const sortBy = query.sortBy || 'startDateTime';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder;

    const [campaigns, total] = await Promise.all([
      Campaign.find(filterQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(filterQuery)
    ]);

    // Format output to include calculated capacity details
    const formattedCampaigns = campaigns.map((c: any) => {
      const registered = c.registeredCount || 0;
      const totalCapacity = c.capacity || 1;
      const percentage = Math.min(100, Math.round((registered / totalCapacity) * 100));
      
      return {
        ...c,
        capacityProgress: {
          registered,
          total: totalCapacity,
          percentage
        }
      };
    });

    return {
      data: formattedCampaigns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * BC-UC-02: Create Donation Campaign
   */
  public static async createCampaign(data: any) {
    // Validate campaign date is not in the past
    const startDate = new Date(data.startDateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate.getTime() < today.getTime()) {
      throw new Error('CAMPAIGN_DATE_IN_PAST');
    }

    // Validate capacity and target units goal
    if (data.capacity <= 0 || data.targetUnitsGoal <= 0) {
      throw new Error('INVALID_CAPACITY_OR_GOAL');
    }

    // Auto-generate unique campaign code if not provided
    const year = new Date().getFullYear();
    const count = await Campaign.countDocuments();
    const campaignCode = data.campaignCode || `CMP-${year}-${String(count + 1).padStart(3, '0')}`;

    // Auto-assign initial status
    const status = data.status || 'Upcoming';

    const campaignPayload: any = {
      campaignCode,
      name: data.name,
      description: data.description,
      venue: data.venue,
      fullAddress: data.fullAddress,
      startDateTime: startDate,
      endDateTime: new Date(data.endDateTime),
      targetBloodGroups: data.targetBloodGroups,
      capacity: data.capacity,
      registeredCount: 0,
      targetUnitsGoal: data.targetUnitsGoal,
      contactPerson: data.contactPerson,
      internalRemarks: data.internalRemarks,
      status
    };

    if (data.bloodCenterId) {
      campaignPayload.bloodCenterId = data.bloodCenterId;
    }

    // Only set location if valid coordinates array of length 2 is explicitly provided;
    // otherwise let Mongoose schema default apply naturally ({ type: 'Point', coordinates: [106.660172, 10.762622] })
    if (
      data.location &&
      Array.isArray(data.location.coordinates) &&
      data.location.coordinates.length === 2 &&
      typeof data.location.coordinates[0] === 'number' &&
      typeof data.location.coordinates[1] === 'number'
    ) {
      campaignPayload.location = data.location;
    }

    const campaign = new Campaign(campaignPayload);

    await campaign.save();
    return campaign.toObject();
  }

  /**
   * BC-UC-03: View Campaign Details
   */
  public static async getCampaignById(id: string) {
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    const registered = campaign.registeredCount || 0;
    const totalCapacity = campaign.capacity || 1;
    const capacityPercentage = Math.min(100, Math.round((registered / totalCapacity) * 100));
    const targetGoal = campaign.targetUnitsGoal || 1;
    const percentGoalReached = Math.round((registered / targetGoal) * 100);
    const remainingSpots = Math.max(0, totalCapacity - registered);

    return {
      ...campaign,
      capacityProgress: {
        registeredDonors: registered,
        totalCapacity,
        percentage: capacityPercentage
      },
      registrationPerformance: {
        targetUnitsGoal: targetGoal,
        registeredDonorsCount: registered,
        remainingSpots,
        percentGoalReached
      }
    };
  }

  /**
   * BC-UC-03: Edit Campaign Details
   */
  public static async updateCampaign(id: string, updateData: any) {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    // Validation rule: cannot reduce participant capacity below current number of registered donors
    if (updateData.capacity !== undefined && updateData.capacity < campaign.registeredCount) {
      throw new Error('CAPACITY_BELOW_REGISTERED');
    }

    if (updateData.startDateTime) {
      campaign.startDateTime = new Date(updateData.startDateTime);
    }
    if (updateData.endDateTime) {
      campaign.endDateTime = new Date(updateData.endDateTime);
    }

    Object.keys(updateData).forEach((key) => {
      if (key !== 'startDateTime' && key !== 'endDateTime') {
        (campaign as any)[key] = updateData[key];
      }
    });

    await campaign.save();
    return campaign.toObject();
  }

  /**
   * Sub-resource endpoint: Get Registrations for a Campaign
   */
  public static async getCampaignRegistrations(campaignId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    const appointments = await Appointment.find({ campaignId })
      .populate('donorId', 'fullName bloodType phone email idDocumentNumber')
      .populate('screeningFormId')
      .sort({ appointmentDate: -1 })
      .lean();

    return appointments;
  }
}
