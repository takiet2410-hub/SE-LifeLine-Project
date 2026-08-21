import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/auth.middleware';
import { RegistrationService } from '../services/registration.service';

export class RegistrationController {
  /**
   * GET /api/v1/campaigns/:campaignId/registrations
   */
  static async listCampaignRegistrations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const campaignId = String(req.params.campaignId);
      const actorUserId = String(req.user?._id || req.user?.id || '');
      const rawIp = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
      const ipAddress = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);

      const result = await RegistrationService.getCampaignRegistrations(
        campaignId,
        req.query || {},
        actorUserId,
        ipAddress
      );

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/registrations/:registrationId
   */
  static async getRegistrationById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const registrationId = String(req.params.registrationId);
      const result = await RegistrationService.getRegistrationById(registrationId);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /api/v1/registrations/:registrationId/screening
   */
  static async updateRegistrationScreening(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const registrationId = String(req.params.registrationId);
      const actorUserId = String(req.user?._id || req.user?.id || '');
      const rawIp = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
      const ipAddress = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);

      const result = await RegistrationService.updateRegistrationScreening(
        registrationId,
        req.body,
        actorUserId,
        ipAddress
      );

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/v1/registrations/qr-checkin
   */
  static async checkInByQRCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { qrPayload, campaignId } = req.body;
      const actorUserId = String(req.user?._id || req.user?.id || '');
      const result = await RegistrationService.checkInByQRCode(qrPayload || '', actorUserId, campaignId);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
}
