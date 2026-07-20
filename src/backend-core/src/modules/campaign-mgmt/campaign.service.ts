import { CreateCampaignInput, UpdateCampaignInput } from './schemas/campaign.schema';
import campaignRepository from './campaign.repository';
import { ICampaign } from './models/campaign.model';

export class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(input: CreateCampaignInput): Promise<ICampaign> {
    const campaignData = {
      ...input,
      registeredCount: 0,
      status: input.status || 'Draft',
    };

    return await campaignRepository.create(campaignData);
  }

  /**
   * Retrieve all campaigns
   */
  async getAllCampaigns(): Promise<ICampaign[]> {
    return await campaignRepository.findAll();
  }

  /**
   * Retrieve a campaign by ID
   */
  async getCampaignById(id: string): Promise<ICampaign | null> {
    return await campaignRepository.findById(id);
  }

  /**
   * Update a campaign
   * Enforces business rules:
   * - capacity cannot be reduced below registeredCount
   * - registeredCount is server-managed and cannot be updated
   */
  async updateCampaign(id: string, input: UpdateCampaignInput): Promise<ICampaign | null> {
    const campaign = await campaignRepository.findById(id);
    if (!campaign) {
      return null;
    }

    // Validate capacity rule: cannot reduce below registeredCount
    if (input.capacity !== undefined && input.capacity < campaign.registeredCount) {
      const error = new Error(
        `Capacity cannot be reduced below current registered count (${campaign.registeredCount})`
      ) as any;
      error.statusCode = 400;
      error.code = 'BUSINESS_RULE_VIOLATION';
      error.details = { field: 'capacity' };
      throw error;
    }

    // Validate date rules: endDateTime must be later than startDateTime
    const start = input.startDateTime !== undefined ? input.startDateTime : campaign.startDateTime;
    const end = input.endDateTime !== undefined ? input.endDateTime : campaign.endDateTime;
    if (start && end && end <= start) {
      const error = new Error('End date/time must be after start date/time') as any;
      error.statusCode = 400;
      error.code = 'BUSINESS_RULE_VIOLATION';
      error.details = { field: 'endDateTime' };
      throw error;
    }

    // Remove server-managed fields from update
    const safeUpdateData = input;
    return await campaignRepository.update(id, safeUpdateData);
  }

  /**
   * Retrieve campaigns by blood center ID
   */
  async getCampaignsByBloodCenterId(bloodCenterId: string): Promise<ICampaign[]> {
    return await campaignRepository.findByBloodCenterId(bloodCenterId);
  }

  /**
   * Retrieve campaigns by status
   */
  async getCampaignsByStatus(status: string): Promise<ICampaign[]> {
    return await campaignRepository.findByStatus(status);
  }
}

export default new CampaignService();
