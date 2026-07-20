import campaignController from './campaign.controller';
import campaignService from './campaign.service';
import { createCampaignSchema, updateCampaignSchema } from './schemas/campaign.schema';
import Campaign from './models/campaign.model';
import campaignRepository from './campaign.repository';
import { AuditLogger } from '../../shared/audit/audit-logger';
import { validate } from '../../shared/validate.middleware';
import { errorMiddleware } from '../../shared/error.middleware';

jest.mock('./campaign.repository');
jest.mock('../../shared/audit/audit-logger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockedRepository = campaignRepository as jest.Mocked<typeof campaignRepository>;
const mockedAuditLogger = AuditLogger as jest.Mocked<typeof AuditLogger>;

describe('Campaign Module - Phase 1 Tests', () => {
  describe('Validation', () => {
    it('should validate create campaign schema with valid data', () => {
      const validData = {
        bloodCenterId: 'bc-001',
        name: 'Blood Drive Q3 2026',
        venue: 'Central Hospital',
        location: {
          type: 'Point',
          coordinates: [106.700424, 10.776889],
        },
        startDateTime: '2026-08-01T08:00:00Z',
        endDateTime: '2026-08-05T17:00:00Z',
        targetBloodGroups: ['O+', 'O-'],
        capacity: 100,
      };

      expect(() => createCampaignSchema.parse({ body: validData })).not.toThrow();
    });

    it('should reject schema with endDateTime before startDateTime', () => {
      const invalidData = {
        bloodCenterId: 'bc-001',
        name: 'Campaign',
        venue: 'Venue',
        startDateTime: '2026-08-05T17:00:00Z',
        endDateTime: '2026-08-01T08:00:00Z',
        targetBloodGroups: ['O+'],
        capacity: 100,
      };

      expect(() => createCampaignSchema.parse({ body: invalidData })).toThrow();
    });

    it('should reject schema with capacity < 1', () => {
      const invalidData = {
        bloodCenterId: 'bc-001',
        name: 'Campaign',
        venue: 'Venue',
        startDateTime: '2026-08-01T08:00:00Z',
        endDateTime: '2026-08-05T17:00:00Z',
        targetBloodGroups: ['O+'],
        capacity: 0,
      };

      expect(() => createCampaignSchema.parse({ body: invalidData })).toThrow();
    });

    it('should reject schema with missing required fields', () => {
      const invalidData = {
        bloodCenterId: 'bc-001',
        // missing name
        venue: 'Venue',
        startDateTime: '2026-08-01T08:00:00Z',
        endDateTime: '2026-08-05T17:00:00Z',
        targetBloodGroups: ['O+'],
        capacity: 100,
      };

      expect(() => createCampaignSchema.parse({ body: invalidData })).toThrow();
    });
  });

  describe('Business Rules', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should prevent capacity reduction below registeredCount', async () => {
      const mockCampaign = {
        _id: 'campaign-123',
        bloodCenterId: 'bc-001',
        name: 'Blood Drive',
        venue: 'Central Hospital',
        startDateTime: new Date('2026-08-01T08:00:00Z'),
        endDateTime: new Date('2026-08-05T17:00:00Z'),
        targetBloodGroups: ['O+'],
        capacity: 100,
        registeredCount: 50,
        status: 'Active',
      };

      mockedRepository.findById.mockResolvedValue(mockCampaign as any);

      await expect(
        campaignService.updateCampaign('campaign-123', { capacity: 40 })
      ).rejects.toThrow('Capacity cannot be reduced below current registered count (50)');

      expect(mockedRepository.findById).toHaveBeenCalledWith('campaign-123');
      expect(mockedRepository.update).not.toHaveBeenCalled();
    });

    it('should prevent endDateTime from being before startDateTime during updates', async () => {
      const mockCampaign = {
        _id: 'campaign-123',
        bloodCenterId: 'bc-001',
        name: 'Blood Drive',
        venue: 'Central Hospital',
        startDateTime: new Date('2026-08-01T08:00:00Z'),
        endDateTime: new Date('2026-08-05T17:00:00Z'),
        targetBloodGroups: ['O+'],
        capacity: 100,
        registeredCount: 10,
        status: 'Active',
      };

      mockedRepository.findById.mockResolvedValue(mockCampaign as any);

      // Attempt to set startDateTime after the current endDateTime
      await expect(
        campaignService.updateCampaign('campaign-123', {
          startDateTime: new Date('2026-08-06T08:00:00Z'),
        })
      ).rejects.toThrow('End date/time must be after start date/time');

      expect(mockedRepository.update).not.toHaveBeenCalled();
    });

    it('should successfully update campaign when business rules are satisfied', async () => {
      const mockCampaign = {
        _id: 'campaign-123',
        bloodCenterId: 'bc-001',
        name: 'Blood Drive',
        venue: 'Central Hospital',
        startDateTime: new Date('2026-08-01T08:00:00Z'),
        endDateTime: new Date('2026-08-05T17:00:00Z'),
        targetBloodGroups: ['O+'],
        capacity: 100,
        registeredCount: 10,
        status: 'Active',
      };

      mockedRepository.findById.mockResolvedValue(mockCampaign as any);
      mockedRepository.update.mockResolvedValue({ ...mockCampaign, capacity: 120 } as any);

      const result = await campaignService.updateCampaign('campaign-123', { capacity: 120 });

      expect(result).toBeDefined();
      expect(result?.capacity).toBe(120);
      expect(mockedRepository.update).toHaveBeenCalledWith('campaign-123', { capacity: 120 });
    });
  });

  describe('CampaignController', () => {
    let mockRequest: any;
    let mockResponse: any;
    let nextFunction: any;

    beforeEach(() => {
      mockRequest = {};
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn((err?: any) => {
        if (err) {
          errorMiddleware(err, mockRequest, mockResponse, jest.fn());
        }
      });
      mockedAuditLogger.log.mockClear();
    });

    describe('createCampaign', () => {
      it('should return 400 on Zod validation error', async () => {
        mockRequest.body = {};

        const validateMiddleware = validate(createCampaignSchema);
        await validateMiddleware(mockRequest, mockResponse, (err?: any) => {
          if (err) {
            errorMiddleware(err, mockRequest, mockResponse, jest.fn());
          }
        });

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'VALIDATION_ERROR',
          })
        );
      });

      it('should successfully create campaign', async () => {
        const campaignData = {
          bloodCenterId: 'bc-001',
          name: 'Blood Drive',
          venue: 'Central Hospital',
          location: {
            type: 'Point',
            coordinates: [106.700424, 10.776889],
          },
          startDateTime: '2026-08-01T08:00:00Z',
          endDateTime: '2026-08-05T17:00:00Z',
          targetBloodGroups: ['O+'],
          capacity: 100,
          status: 'Draft',
        };
        mockRequest.body = campaignData;
        mockRequest.user = { id: 'staff-456', role: 'Blood Center Staff' };

        const createdCampaign = { ...campaignData, _id: 'campaign-123', registeredCount: 0 };
        jest.spyOn(campaignService, 'createCampaign').mockResolvedValue(createdCampaign as any);

        await campaignController.createCampaign(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(createdCampaign);
        expect(mockedAuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            actorId: 'staff-456',
            action: 'CREATE_CAMPAIGN',
            targetId: 'campaign-123',
            targetType: 'Campaign',
          })
        );
      });
    });

    describe('updateCampaign', () => {
      it('should reject updates to server-managed properties', async () => {
        mockRequest.params = { id: 'campaign-123' };
        mockRequest.body = {
          registeredCount: 10,
        };

        await campaignController.updateCampaign(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'BUSINESS_RULE_VIOLATION',
            message: 'Updates to server-managed property registeredCount are not allowed',
          })
        );
      });

      it('should return 404 if campaign is not found', async () => {
        mockRequest.params = { id: 'campaign-nonexistent' };
        mockRequest.body = {
          capacity: 120,
        };

        jest.spyOn(campaignService, 'getCampaignById').mockResolvedValue(null);

        await campaignController.updateCampaign(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'NOT_FOUND',
          })
        );
      });

      it('should successfully update campaign and write audit log', async () => {
        mockRequest.params = { id: 'campaign-123' };
        mockRequest.body = {
          capacity: 120,
        };
        mockRequest.user = { id: 'staff-456', role: 'Blood Center Staff' };

        const mockCampaign = {
          _id: 'campaign-123',
          bloodCenterId: 'bc-001',
          name: 'Blood Drive',
          venue: 'Central Hospital',
          startDateTime: new Date('2026-08-01T08:00:00Z'),
          endDateTime: new Date('2026-08-05T17:00:00Z'),
          targetBloodGroups: ['O+'],
          capacity: 100,
          registeredCount: 10,
          status: 'Active',
        };

        jest.spyOn(campaignService, 'getCampaignById').mockResolvedValue(mockCampaign as any);
        jest.spyOn(campaignService, 'updateCampaign').mockResolvedValue({ ...mockCampaign, capacity: 120 } as any);

        await campaignController.updateCampaign(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockedAuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            actorId: 'staff-456',
            action: 'UPDATE_CAMPAIGN',
            targetId: 'campaign-123',
            targetType: 'Campaign',
          })
        );
      });
    });
  });

  describe('Module Exports', () => {
    it('should export all required campaign module components', () => {
      expect(campaignController).toBeDefined();
      expect(campaignService).toBeDefined();
      expect(Campaign).toBeDefined();
      expect(createCampaignSchema).toBeDefined();
      expect(updateCampaignSchema).toBeDefined();
    });
  });
});
