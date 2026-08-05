import mongoose from 'mongoose';
import { Campaign, ICampaign } from '../models/campaign.model';
import { Appointment } from '../../booking/models/appointment.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { User } from '../../auth-account/models/user.model';

const geocodeAddress = async (addressStr?: string): Promise<[number, number] | null> => {
  if (!addressStr || typeof addressStr !== 'string') return null;
  const cleanAddr = addressStr.trim();
  if (!cleanAddr) return null;

  let queryStr = cleanAddr;
  if (!queryStr.toLowerCase().includes('hồ chí minh') && !queryStr.toLowerCase().includes('hcm') && !queryStr.toLowerCase().includes('tphcm')) {
    queryStr += ', TP. Hồ Chí Minh';
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryStr)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LifeLine-BloodDonation/1.0 (contact@lifeline.org.vn)'
      }
    });
    if (response.ok) {
      const data = (await response.json()) as any[];
      if (data && data.length > 0 && data[0].lon && data[0].lat) {
        const lng = parseFloat(data[0].lon);
        const lat = parseFloat(data[0].lat);
        if (!isNaN(lng) && !isNaN(lat)) {
          return [lng, lat];
        }
      }
    }
  } catch (err) {
    console.warn('[geocodeAddress] Nominatim fetch error:', err);
  }

  const lower = cleanAddr.toLowerCase();
  if (lower.includes('quận 1') || lower.includes('q1')) return [106.699280, 10.780561];
  if (lower.includes('quận 3') || lower.includes('q3')) return [106.683610, 10.763428];
  if (lower.includes('quận 5') || lower.includes('q5')) return [106.660172, 10.755498];
  if (lower.includes('quận 10') || lower.includes('q10')) return [106.666133, 10.756247];
  if (lower.includes('bình thạnh')) return [106.696120, 10.803510];
  if (lower.includes('tân bình')) return [106.660812, 10.771945];
  if (lower.includes('gò vấp')) return [106.678240, 10.817530];
  if (lower.includes('thủ đức')) return [106.758410, 10.852530];

  return [106.660172, 10.762622];
};

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

    // Format output to include calculated capacity details & dynamic real-time status
    const now = new Date();
    const formattedCampaigns = campaigns.map((c: any) => {
      const registered = c.registeredCount || 0;
      const totalCapacity = c.capacity || 1;
      const percentage = Math.min(100, Math.round((registered / totalCapacity) * 100));
      
      let computedStatus = c.status;
      if (c.status !== 'Cancelled') {
        const start = c.startDateTime ? new Date(c.startDateTime) : null;
        const end = c.endDateTime ? new Date(c.endDateTime) : null;
        if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
          if (now >= start && now <= end) {
            computedStatus = 'Active';
          } else if (now < start) {
            computedStatus = 'Upcoming';
          } else if (now > end) {
            computedStatus = 'Completed';
          }
        }
      }

      return {
        ...c,
        status: computedStatus,
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
    // Parse dates
    const startDate = new Date(data.startDate || data.startDateTime);
    const endDate = new Date(data.endDate || data.endDateTime || startDate);

    if (endDate.getTime() < startDate.getTime()) {
      throw new Error('INVALID_DATE_RANGE');
    }

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

    const status = data.status || 'Upcoming';

    const slotCap = Math.max(5, Math.round((data.capacity || 100) / 5));
    const defaultSlots = [
      { startTime: '07:30', endTime: '09:00', capacity: slotCap, registeredCount: 0 },
      { startTime: '09:00', endTime: '10:30', capacity: slotCap, registeredCount: 0 },
      { startTime: '10:30', endTime: '12:00', capacity: slotCap, registeredCount: 0 },
      { startTime: '13:30', endTime: '15:00', capacity: slotCap, registeredCount: 0 },
      { startTime: '15:00', endTime: '16:30', capacity: slotCap, registeredCount: 0 },
    ];
    const timeslotsPattern = data.timeslots && data.timeslots.length > 0 ? data.timeslots : defaultSlots;

    let earliestTime = '23:59';
    let latestTime = '00:00';
    timeslotsPattern.forEach((slot: any) => {
      if (slot.startTime < earliestTime) earliestTime = slot.startTime;
      if (slot.endTime > latestTime) latestTime = slot.endTime;
    });

    // Start date at earliest time, end date at latest time (in local time mapped to UTC)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const actualStartDateTime = new Date(`${startDateStr}T${earliestTime}:00`);
    const actualEndDateTime = new Date(`${endDateStr}T${latestTime}:00`);

    // Generate daily timeslots
    const dailyTimeslots: any[] = [];
    const currentDay = new Date(startDate.getTime());
    while (currentDay.getTime() <= endDate.getTime()) {
      const dateStr = currentDay.toISOString().split('T')[0];
      for (const slot of timeslotsPattern) {
        dailyTimeslots.push({
          startTime: new Date(`${dateStr}T${slot.startTime}:00`),
          endTime: new Date(`${dateStr}T${slot.endTime}:00`),
          capacity: slot.capacity,
          registeredCount: 0
        });
      }
      currentDay.setDate(currentDay.getDate() + 1);
    }

    const campaignPayload: any = {
      campaignCode,
      name: data.name,
      description: data.description || data.name,
      venue: data.venue,
      fullAddress: data.fullAddress || data.venue || 'TP. Hồ Chí Minh',
      startDateTime: actualStartDateTime,
      endDateTime: actualEndDateTime,
      targetBloodGroups: data.targetBloodGroups || ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      capacity: data.capacity,
      registeredCount: 0,
      targetUnitsGoal: data.targetUnitsGoal || (data.capacity ? Math.round(data.capacity * 0.8) : 80),
      contactPerson: data.contactPerson || { name: 'Cán bộ Kho máu', phone: '0909123456' },
      internalRemarks: data.internalRemarks,
      timeslots: timeslotsPattern,
      dailyTimeslots,
      status
    };

    if (data.bloodCenterId && mongoose.Types.ObjectId.isValid(data.bloodCenterId)) {
      campaignPayload.bloodCenterId = new mongoose.Types.ObjectId(data.bloodCenterId);
    }

    // Geocode fullAddress / venue to map coordinates if location is not explicitly provided
    if (
      data.location &&
      Array.isArray(data.location.coordinates) &&
      data.location.coordinates.length === 2 &&
      typeof data.location.coordinates[0] === 'number' &&
      typeof data.location.coordinates[1] === 'number'
    ) {
      campaignPayload.location = data.location;
    } else {
      const coords = await geocodeAddress(campaignPayload.fullAddress || campaignPayload.venue);
      if (coords) {
        campaignPayload.location = { type: 'Point', coordinates: coords };
      }
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

    const now = new Date();
    let computedStatus = campaign.status;
    if (campaign.status !== 'Cancelled') {
      const start = campaign.startDateTime ? new Date(campaign.startDateTime) : null;
      const end = campaign.endDateTime ? new Date(campaign.endDateTime) : null;
      if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (now >= start && now <= end) {
          computedStatus = 'Active';
        } else if (now < start) {
          computedStatus = 'Upcoming';
        } else if (now > end) {
          computedStatus = 'Completed';
        }
      }
    }

    return {
      ...campaign,
      status: computedStatus,
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

    if (updateData.venue) {
      campaign.venue = updateData.venue;
      if (!updateData.fullAddress) {
        campaign.fullAddress = updateData.venue;
      }
    }
    if (updateData.fullAddress) {
      campaign.fullAddress = updateData.fullAddress;
    }

    // Geocode updated fullAddress / venue to map coordinates if location is not explicitly passed
    if (
      updateData.location &&
      Array.isArray(updateData.location.coordinates) &&
      updateData.location.coordinates.length === 2 &&
      typeof updateData.location.coordinates[0] === 'number' &&
      typeof updateData.location.coordinates[1] === 'number'
    ) {
      campaign.location = updateData.location;
    } else if (updateData.venue || updateData.fullAddress) {
      const coords = await geocodeAddress(campaign.fullAddress || campaign.venue);
      if (coords) {
        campaign.location = { type: 'Point', coordinates: coords };
      }
    }

    Object.keys(updateData).forEach((key) => {
      if (key !== 'startDateTime' && key !== 'endDateTime' && key !== 'venue' && key !== 'fullAddress' && key !== 'location') {
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
    if (campaignId && campaignId !== 'all') {
      const campaign = mongoose.Types.ObjectId.isValid(campaignId) ? await Campaign.findById(campaignId) : null;
      if (!campaign) {
        throw new Error('CAMPAIGN_NOT_FOUND');
      }
    }

    let filter: any = {};
    if (campaignId && campaignId !== 'all') {
      filter = { campaignId: new mongoose.Types.ObjectId(campaignId) };
    }

    const appointments = await Appointment.find(filter)
      .populate('donorId', 'fullName bloodType phone email idDocumentNumber')
      .populate('screeningFormId')
      .sort({ appointmentDate: -1 })
      .lean();

    return appointments;
  }
}
