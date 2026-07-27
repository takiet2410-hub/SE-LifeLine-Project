import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';

export class BookingController {
  public static async listLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await BookingService.searchLocations(req.query);
      res.status(200).json(locations);
    } catch (error) {
      next(error);
    }
  }

  public static async createAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const donorId = (req as any).user._id.toString();
      const appointment = await BookingService.createAppointment(donorId, req.body);
      res.status(201).json(appointment);
    } catch (error: any) {
      if (error.message.includes('NOT_FOUND')) res.status(404).json({ message: error.message });
      else if (error.message.includes('CAMPAIGN_NOT_ACTIVE') || error.message.includes('FULL') || error.message.includes('DUPLICATE')) res.status(409).json({ message: error.message });
      else if (error.message.includes('ELIGIBILITY')) res.status(403).json({ message: error.message });
      else next(error);
    }
  }

  public static async getAppointmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const donorId = (req as any).user._id.toString();
      const appointment = await BookingService.getAppointmentById(req.params.id as string, donorId);
      res.status(200).json(appointment);
    } catch (error: any) {
      if (error.message.includes('NOT_FOUND')) res.status(404).json({ message: error.message });
      else next(error);
    }
  }

  public static async listAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const donorId = (req as any).user._id.toString();
      const appointments = await BookingService.listAppointments(donorId);
      res.status(200).json(appointments);
    } catch (error) {
      next(error);
    }
  }

  public static async cancelAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const donorId = (req as any).user._id.toString();
      const appointment = await BookingService.cancelAppointment(req.params.id as string, donorId);
      res.status(200).json(appointment);
    } catch (error: any) {
      if (error.message.includes('NOT_FOUND')) res.status(404).json({ message: error.message });
      else if (error.message.includes('INVALID') || error.message.includes('DEADLINE')) res.status(403).json({ message: error.message });
      else next(error);
    }
  }

  public static async downloadETicket(req: Request, res: Response, next: NextFunction) {
    try {
      const donorId = (req as any).user._id.toString();
      const eTicket = await BookingService.downloadETicket(req.params.id as string, donorId);
      res.status(200).json(eTicket);
    } catch (error: any) {
      if (error.message.includes('NOT_FOUND')) res.status(404).json({ message: error.message });
      else if (error.message.includes('ETICKET_NOT_READY')) res.status(400).json({ message: error.message });
      else next(error);
    }
  }

  public static async syncToBloodCenter(req: Request, res: Response, next: NextFunction) {
    try {
      const donorId = (req as any).user._id.toString();
      const result = await BookingService.syncToBloodCenter(req.params.id as string, donorId);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message.includes('NOT_FOUND')) res.status(404).json({ message: error.message });
      else next(error);
    }
  }

  public static async confirmAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const appointmentId = req.params.id as string;
      const appointment = await BookingService.confirmAppointmentByBloodCenter(appointmentId);
      res.status(200).json(appointment);
    } catch (error: any) {
      if (error.message.includes('NOT_FOUND')) res.status(404).json({ message: error.message });
      else if (error.message.includes('INVALID')) res.status(403).json({ message: error.message });
      else next(error);
    }
  }
}

