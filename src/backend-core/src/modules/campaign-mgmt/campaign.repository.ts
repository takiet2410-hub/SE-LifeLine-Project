import Campaign, { ICampaign } from './models/campaign.model';

export class CampaignRepository {
  /**
   * Create a new campaign
   */
  async create(campaignData: Partial<ICampaign>): Promise<ICampaign> {
    const campaign = new Campaign(campaignData);
    return await campaign.save();
  }

  /**
   * Retrieve all campaigns
   */
  async findAll(): Promise<ICampaign[]> {
    return await Campaign.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Retrieve a campaign by ID
   */
  async findById(id: string): Promise<ICampaign | null> {
    return await Campaign.findById(id).exec();
  }

  /**
   * Update an existing campaign
   */
  async update(id: string, updateData: Partial<ICampaign>): Promise<ICampaign | null> {
    return await Campaign.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
  }

  /**
   * Find campaigns by blood center ID
   */
  async findByBloodCenterId(bloodCenterId: string): Promise<ICampaign[]> {
    return await Campaign.find({ bloodCenterId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find campaigns by status
   */
  async findByStatus(status: string): Promise<ICampaign[]> {
    return await Campaign.find({ status }).sort({ createdAt: -1 }).exec();
  }
}

export default new CampaignRepository();
