import { Request, Response, NextFunction } from 'express';
import { CampaignService } from '../services/campaign.service';

export class CampaignController {
  public static async listCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CampaignService.listCampaigns(req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('--- [DEBUG] createCampaign Request ---');
      console.log('User Role:', (req as any).user?.role);
      console.log('User BloodCenterId:', (req as any).user?.bloodCenterId);
      console.log('Payload Received:', JSON.stringify(req.body, null, 2));

      const user = (req as any).user;
      if (user && user.bloodCenterId) {
        req.body.bloodCenterId = user.bloodCenterId.toString();
      }

      const campaign = await CampaignService.createCampaign(req.body);
      console.log('--- [DEBUG] Campaign Created Successfully ---', campaign._id);
      res.status(201).json(campaign);
    } catch (error: any) {
      console.error('--- [DEBUG] createCampaign Error ---', error);
      let friendlyMessage = error.message;
      if (error.message === 'CAMPAIGN_DATE_IN_PAST') {
        friendlyMessage = 'Ngày bắt đầu chiến dịch không được nằm trong quá khứ.';
      } else if (error.message === 'INVALID_CAPACITY_OR_GOAL') {
        friendlyMessage = 'Số lượng người tham gia hoặc chỉ tiêu máu không hợp lệ.';
      } else if (error.message === 'INVALID_DATE_RANGE') {
        friendlyMessage = 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu.';
      }

      if (
        error.message === 'CAMPAIGN_DATE_IN_PAST' || 
        error.message === 'INVALID_CAPACITY_OR_GOAL' ||
        error.message === 'INVALID_DATE_RANGE' ||
        error.message?.includes('thời lượng trễ hơn ít nhất 30 phút') ||
        error.message?.includes('validation')
      ) {
        res.status(400).json({ code: 'VALIDATION_ERROR', message: friendlyMessage });
      } else {
        next(error);
      }
    }
  }

  public static async getCampaignById(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await CampaignService.getCampaignById(req.params.id as string);
      res.status(200).json(campaign);
    } catch (error: any) {
      if (error.message === 'CAMPAIGN_NOT_FOUND') {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Campaign not found' });
      } else {
        next(error);
      }
    }
  }

  public static async updateCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await CampaignService.updateCampaign(req.params.id as string, req.body);
      res.status(200).json(campaign);
    } catch (error: any) {
      if (error.message === 'CAMPAIGN_NOT_FOUND') {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Campaign not found' });
      } else if (error.message === 'CAPACITY_BELOW_REGISTERED') {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Cannot reduce participant capacity below the current number of registered donors'
        });
      } else {
        next(error);
      }
    }
  }

  public static async getCampaignRegistrations(req: Request, res: Response, next: NextFunction) {
    try {
      const registrations = await CampaignService.getCampaignRegistrations(req.params.id as string);
      res.status(200).json(registrations);
    } catch (error: any) {
      if (error.message === 'CAMPAIGN_NOT_FOUND') {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Campaign not found' });
      } else {
        next(error);
      }
    }
  }
}
