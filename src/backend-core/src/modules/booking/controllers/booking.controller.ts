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

  public static async seedCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const mongoose = require('mongoose');
      const Campaign = mongoose.models.Campaign;
      if (!Campaign) throw new Error('Campaign model not found');

      await Campaign.deleteMany({});
      
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const timeSlots = [
        { startTime: '08:00', endTime: '09:00', capacity: 10, registeredCount: 0 },
        { startTime: '09:00', endTime: '10:00', capacity: 10, registeredCount: 0 },
        { startTime: '10:00', endTime: '11:00', capacity: 10, registeredCount: 0 },
        { startTime: '13:00', endTime: '14:00', capacity: 10, registeredCount: 0 },
        { startTime: '14:00', endTime: '15:00', capacity: 10, registeredCount: 0 },
        { startTime: '15:00', endTime: '16:00', capacity: 10, registeredCount: 0 }
      ];

      const campaigns = [
        {
          name: 'Cho Ray Hospital - Regular Blood Drive',
          location: { type: 'Point', coordinates: [106.660172, 10.755498] },
          startDateTime: now,
          endDateTime: nextMonth,
          capacity: 100,
          registeredCount: 0,
          status: 'Active',
          targetBloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
          timeSlots
        },
        {
          name: 'Blood Transfusion Hematology Hospital',
          location: { type: 'Point', coordinates: [106.666133, 10.756247] },
          startDateTime: now,
          endDateTime: nextMonth,
          capacity: 150,
          registeredCount: 0,
          status: 'Active',
          targetBloodGroups: ['A+', 'B+', 'O+', 'O-'],
          timeSlots
        },
        {
          name: 'Tu Du Hospital - Maternity Support',
          location: { type: 'Point', coordinates: [106.683610, 10.763428] },
          startDateTime: now,
          endDateTime: nextMonth,
          capacity: 80,
          registeredCount: 0,
          status: 'Active',
          targetBloodGroups: ['O-', 'AB-'],
          timeSlots
        }
      ];

      await Campaign.insertMany(campaigns);
      res.status(200).json({ success: true, message: 'Seeded 3 campaigns successfully' });
    } catch (error) {
      next(error);
    }
  }
}

