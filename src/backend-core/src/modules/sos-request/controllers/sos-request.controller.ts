import { Request, Response, NextFunction } from 'express';
import { SOSRequestService } from '../services/sos-request.service';
import { SOSEvaluationLog } from '../models/sos-evaluation-log.model';
import { Hospital } from '../../auth-account/models/hospital.model';
import { Notification } from '../../notification/models/Notification';

const getUserId = (req: Request) => (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
const getUserRoles = (req: Request): string[] => Array.from(new Set([
  (req as any).user?.role,
  ...(Array.isArray((req as any).user?.roles) ? (req as any).user.roles : []),
].filter(Boolean))) as string[];

export class SOSRequestController {
  public static async listHospitals(req: Request, res: Response, next: NextFunction) {
    try {
    const hospitals = await Hospital.find({
      $or: [{ isVerified: true }, { isVerified: { $exists: false } }]
    }).select('-createdAt -updatedAt');
      res.status(200).json(hospitals);
    } catch (error) {
      next(error);
    }
  }

  public static async createSOSRequest(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract userId from JWT (always required)
      const userId = (req as any).user?.userId || (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: user identity is required' });
      }
      const roles = getUserRoles(req);
      const hospitalId = roles.includes('Administrator') ? req.body.hospitalId : (req as any).user?.hospitalId?.toString();
      
      if (!hospitalId) {
        return res.status(400).json({ message: 'hospitalId is required' });
      }
      
      const request = await SOSRequestService.createSOSRequest(req.body, userId, hospitalId);
      res.status(201).json(request);
    } catch (error) {
      next(error);
    }
  }

  public static async listSOSRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = getUserRoles(req);
      const hospitalId = roles.includes('HospitalStaff') && !roles.includes('Administrator')
        ? (req as any).user?.hospitalId?.toString()
        : req.query.hospitalId;

      if (roles.includes('HospitalStaff') && !roles.includes('Administrator') && !hospitalId) {
        return res.status(403).json({ code: 'HOSPITAL_NOT_ASSIGNED', message: 'Tài khoản chưa được gán bệnh viện.' });
      }

      const filters = { ...req.query, hospitalId };
      const result = await SOSRequestService.getSOSRequests(filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getSOSRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await SOSRequestService.getSOSRequestById(req.params.id as string);
      const roles = getUserRoles(req);
      const userId = getUserId(req);

      if (roles.includes('HospitalStaff') && !roles.includes('Administrator')) {
        const assignedHospitalId = (req as any).user?.hospitalId?.toString();
        const requestHospitalId = (request as any).hospitalId?._id?.toString() || (request as any).hospitalId?.toString();
        if (!assignedHospitalId || assignedHospitalId !== requestHospitalId) {
          return res.status(403).json({ code: 'FORBIDDEN', message: 'Bạn không có quyền xem yêu cầu SOS của bệnh viện khác.' });
        }
      }

      const isDonorOnly = roles.includes('Donor') && !roles.some((role) => ['HospitalStaff', 'BloodCenterStaff', 'Administrator'].includes(role));
      if (isDonorOnly) {
        const accepted = (request as any).acceptedDonorIds?.some((id: any) => id.toString() === userId);
        const notified = userId ? await Notification.exists({
          recipientUserId: userId,
          type: 'SOS',
          $or: [
            { sourceRefId: req.params.id },
            { 'payload.sosRequestId': req.params.id },
            { 'payload.sourceRefId': req.params.id },
          ],
        }) : null;
        if (!accepted && !notified) {
          return res.status(403).json({ code: 'FORBIDDEN', message: 'Yêu cầu SOS này không được gửi đến tài khoản của bạn.' });
        }
      }
      res.status(200).json(request);
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = getUserRoles(req);
      const hospitalId = roles.includes('Administrator') ? undefined : (req as any).user?.hospitalId?.toString();
      const request = await SOSRequestService.updateSOSRequestStatus(req.params.id as string, req.body.status, hospitalId);
      res.status(200).json(request);
    } catch (error) {
      next(error);
    }
  }

  public static async getEvaluationLog(req: Request, res: Response, next: NextFunction) {
    try {
      const evalLog = await SOSEvaluationLog.findOne({ sosRequestId: req.params.id }).sort({ evaluatedAt: -1 });
      if (!evalLog) {
        return res.status(404).json({ message: 'Evaluation log not found' });
      }
      res.status(200).json(evalLog);
    } catch (error) {
      next(error);
    }
  }

  public static async respondToSOS(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { id } = req.params;
      const { response } = req.body;

      const result = await SOSRequestService.recordDonorResponse(String(id), userId as string, response);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async reopenSOSRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { cancelledDonorId } = req.body;
      
      const roles = getUserRoles(req);
      const hospitalId = roles.includes('Administrator') ? undefined : (req as any).user?.hospitalId?.toString();
      const result = await SOSRequestService.reopenSOSRequest(String(id), cancelledDonorId, hospitalId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async fulfillFromInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { id } = req.params;
      const { bagIds } = req.body;

      const result = await SOSRequestService.fulfillFromInventory(String(id), bagIds, userId);
      res.status(200).json(result);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ message: error.message || 'Fulfillment failed' });
    }
  }
  public static async confirmReceived(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { id } = req.params;
      const result = await SOSRequestService.hospitalConfirmReceived(String(id), userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async confirmShipmentReceived(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { id, shipmentId } = req.params;
      const result = await SOSRequestService.hospitalConfirmShipmentReceipt(String(id), String(shipmentId), userId);
      res.status(200).json(result);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ message: error.message || 'Confirm shipment receipt failed' });
    }
  }

  public static async recordDirectDonation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { id } = req.params;
      const result = await SOSRequestService.recordDirectDonation(String(id), userId, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ message: error.message || 'Record direct donation failed' });
    }
  }

  public static async lookupDonor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { query } = req.query;
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const result = await SOSRequestService.lookupDonorForSOS(String(id), String(query || ''), userId);
      res.status(200).json(result);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ message: error.message || 'Lookup donor failed' });
    }
  }
}
