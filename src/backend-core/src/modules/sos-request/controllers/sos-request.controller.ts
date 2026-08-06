import { Request, Response, NextFunction } from 'express';
import { SOSRequestService } from '../services/sos-request.service';
import { SOSEvaluationLog } from '../models/sos-evaluation-log.model';
import { Hospital } from '../../auth-account/models/hospital.model';

export class SOSRequestController {
  public static async listHospitals(req: Request, res: Response, next: NextFunction) {
    try {
      const hospitals = await Hospital.find({ isVerified: true }).select('-createdAt -updatedAt');
      res.status(200).json(hospitals);
    } catch (error) {
      next(error);
    }
  }

  public static async createSOSRequest(req: Request, res: Response, next: NextFunction) {
    try {
      // Mocking userId for testing purposes if auth is missing
      const userId = (req as any).user?.userId || '60d21b4667d0d8992e610c85'; 
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
      const userId = (req as any).user?.userId || '60d21b4667d0d8992e610c85';
      const { id } = req.params;
      const { response } = req.body;

      const result = await SOSRequestService.recordDonorResponse(id as string, userId as string, response);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
