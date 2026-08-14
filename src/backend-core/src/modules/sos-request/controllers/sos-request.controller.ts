import { Request, Response, NextFunction } from 'express';
import { SOSRequestService } from '../services/sos-request.service';
import { SOSEvaluationLog } from '../models/sos-evaluation-log.model';
import { Hospital } from '../../auth-account/models/hospital.model';

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
      const hospitalId = req.body.hospitalId;
      
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
      const userRole = (req as any).user?.role;
      let hospitalId = undefined;
      
      if (userRole === 'HospitalStaff') {
        hospitalId = req.query.hospitalId; 
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
      res.status(200).json(request);
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await SOSRequestService.updateSOSRequestStatus(req.params.id as string, req.body.status);
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
      
      const result = await SOSRequestService.reopenSOSRequest(String(id), cancelledDonorId);
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
}
