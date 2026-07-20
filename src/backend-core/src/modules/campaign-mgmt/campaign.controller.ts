import { Request, Response, NextFunction } from 'express';
import campaignService from './campaign.service';
import { AuditLogger } from '../../shared/audit/audit-logger';
import { AppError } from '../../shared/error.middleware';

export class CampaignController {
  /**
   * POST /api/v1/campaigns
   * Create a new campaign
   */
  async createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.body has already been validated and parsed by validate(createCampaignSchema) middleware
      const campaign = await campaignService.createCampaign(req.body);

      // Audit Log successful campaign creation
      const actorId = (req as any).user?.id || 'system';
      await AuditLogger.log({
        actorId,
        action: 'CREATE_CAMPAIGN',
        targetId: campaign._id.toString(),
        targetType: 'Campaign',
        details: {
          name: campaign.name,
          bloodCenterId: campaign.bloodCenterId,
        },
      });

      res.status(201).json(campaign);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/campaigns
   * Retrieve all campaigns
   */
  async getCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaigns = await campaignService.getAllCampaigns();
      res.status(200).json(campaigns);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/campaigns/:id
   * Retrieve a campaign by ID
   */
  async getCampaignById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const campaign = await campaignService.getCampaignById(id);

      if (!campaign) {
        const error: AppError = new Error(`Campaign with ID ${id} not found`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }

      res.status(200).json(campaign);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/campaigns/:id
   * Update a campaign
   */
  async updateCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Reject updates to server-managed properties
      const serverManagedFields = ['registeredCount', 'createdAt', 'updatedAt', '_id', 'id'];
      for (const field of serverManagedFields) {
        if (field in req.body) {
          const error: AppError = new Error(`Updates to server-managed property ${field} are not allowed`);
          error.statusCode = 400;
          error.code = 'BUSINESS_RULE_VIOLATION';
          error.details = { field };
          return next(error);
        }
      }

      // Check if campaign exists
      const campaign = await campaignService.getCampaignById(id);
      if (!campaign) {
        const error: AppError = new Error(`Campaign with ID ${id} not found`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }

      // Update campaign (req.body validated by validate(updateCampaignSchema))
      const updatedCampaign = await campaignService.updateCampaign(id, req.body);

      if (!updatedCampaign) {
        const error: AppError = new Error(`Campaign with ID ${id} not found`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }

      // Audit Log successful campaign update
      const actorId = (req as any).user?.id || 'system';
      await AuditLogger.log({
        actorId,
        action: 'UPDATE_CAMPAIGN',
        targetId: updatedCampaign._id.toString(),
        targetType: 'Campaign',
        details: {
          updatedFields: Object.keys(req.body),
        },
      });

      res.status(200).json(updatedCampaign);
    } catch (error) {
      next(error);
    }
  }
}

export default new CampaignController();
