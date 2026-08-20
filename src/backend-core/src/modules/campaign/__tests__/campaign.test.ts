import { CampaignService } from '../services/campaign.service';
import { Campaign } from '../models/campaign.model';

describe('CampaignService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCampaign validation', () => {
    it('should throw CAMPAIGN_DATE_IN_PAST if startDateTime is in the past', async () => {
      const pastDate = new Date(Date.now() - 86400000 * 2).toISOString();
      const data = {
        name: 'Past Campaign',
        venue: 'Hospital A',
        fullAddress: '123 Main St',
        startDateTime: pastDate,
        endDateTime: pastDate,
        targetBloodGroups: ['A+'],
        capacity: 100,
        targetUnitsGoal: 80,
        contactPerson: { name: 'John Doe', phone: '0901234567' }
      };

      await expect(CampaignService.createCampaign(data)).rejects.toThrow('CAMPAIGN_DATE_IN_PAST');
    });

    it('should throw INVALID_CAPACITY_OR_GOAL if capacity <= 0', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 10).toISOString();
      const data = {
        name: 'Invalid Capacity Campaign',
        venue: 'Hospital A',
        fullAddress: '123 Main St',
        startDateTime: futureDate,
        endDateTime: futureDate,
        targetBloodGroups: ['A+'],
        capacity: 0,
        targetUnitsGoal: 80,
        contactPerson: { name: 'John Doe', phone: '0901234567' }
      };

      await expect(CampaignService.createCampaign(data)).rejects.toThrow('INVALID_CAPACITY_OR_GOAL');
    });

    it('should successfully create campaign with auto-generated campaignCode and default status', async () => {
      const futureStart = new Date(Date.now() + 86400000 * 5).toISOString();
      const futureEnd = new Date(Date.now() + 86400000 * 6).toISOString();
      const data = {
        name: 'New Donors Drive',
        venue: 'Blood Center 1',
        fullAddress: '456 Central Ave',
        startDateTime: futureStart,
        endDateTime: futureEnd,
        targetBloodGroups: ['O+'],
        capacity: 200,
        targetUnitsGoal: 150,
        contactPerson: { name: 'Jane Smith', phone: '0987654321' },
        location: { type: 'Point', coordinates: [106.66, 10.76] }
      };

      jest.spyOn(Campaign, 'findOne').mockReturnValue({
        sort: jest.fn().mockResolvedValue(null)
      } as any);
      jest.spyOn(Campaign.prototype, 'save').mockResolvedValue({} as any);

      const result = await CampaignService.createCampaign(data);

      expect(result.campaignCode).toMatch(/^CMP-\d{4}-\d{4}$/);
      expect(result.status).toBe('Upcoming');
      expect(result.registeredCount).toBe(0);
      expect(result.name).toBe('New Donors Drive');
    });
  });

  describe('listCampaigns pagination and query filters', () => {
    it('should query campaigns with pagination and format capacityProgress correctly', async () => {
      const mockCampaigns = [
        {
          _id: 'c1',
          name: 'Summer Blood Drive',
          venue: 'City Center',
          registeredCount: 30,
          capacity: 100
        }
      ];

      const chainMock = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockCampaigns)
      };

      jest.spyOn(Campaign, 'find').mockReturnValue(chainMock as any);
      jest.spyOn(Campaign, 'countDocuments').mockResolvedValue(1 as any);

      const result = await CampaignService.listCampaigns({ page: '1', limit: '10', location: 'City' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].capacityProgress).toEqual({
        registered: 30,
        total: 100,
        percentage: 30
      });
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });
  });

  describe('getCampaignById and updateCampaign validation', () => {
    it('should throw CAMPAIGN_NOT_FOUND if campaign does not exist', async () => {
      jest.spyOn(Campaign, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      await expect(CampaignService.getCampaignById('non-existent')).rejects.toThrow('CAMPAIGN_NOT_FOUND');
    });

    it('should throw CAPACITY_BELOW_REGISTERED if new capacity is lower than registeredCount', async () => {
      jest.spyOn(Campaign, 'findById').mockReturnValue({
        _id: 'campaign-123',
        status: 'Active',
        endDateTime: new Date(Date.now() + 86400000).toISOString(),
        registeredCount: 50,
        capacity: 100
      } as any);

      await expect(CampaignService.updateCampaign('campaign-123', { capacity: 30 })).rejects.toThrow(
        'CAPACITY_BELOW_REGISTERED'
      );
    });

    it('should throw CAMPAIGN_ALREADY_ENDED if campaign has already ended or is completed', async () => {
      jest.spyOn(Campaign, 'findById').mockReturnValue({
        _id: 'campaign-completed',
        status: 'Completed',
        endDateTime: new Date(Date.now() - 86400000).toISOString(),
        registeredCount: 50,
        capacity: 100
      } as any);

      await expect(CampaignService.updateCampaign('campaign-completed', { targetBloodGroups: ['O+'] })).rejects.toThrow(
        'CAMPAIGN_ALREADY_ENDED'
      );
    });
  });

  describe('getCampaignRegistrations', () => {
    it('should throw CAMPAIGN_NOT_FOUND if campaign does not exist', async () => {
      jest.spyOn(Campaign, 'findById').mockResolvedValue(null);

      await expect(CampaignService.getCampaignRegistrations('non-existent')).rejects.toThrow('CAMPAIGN_NOT_FOUND');
    });
  });
});
