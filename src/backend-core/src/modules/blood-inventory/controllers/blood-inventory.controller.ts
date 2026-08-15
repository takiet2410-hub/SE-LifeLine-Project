import { Request, Response } from 'express';
import { BloodInventoryService } from '../services/blood-inventory.service';
import { updateStatusSchema, stockInBatchSchema, stockOutSchema } from '../schemas/blood-inventory.schema';

export class BloodInventoryController {
  static async getInventoryList(req: Request, res: Response) {
    try {
      const { page, limit, search, bloodType, status, sort, startDate, endDate } = req.query;
      const user = (req as any).user;
      let userCenterId = req.query.bloodCenterId as string;
      if (user && user.role === 'BloodCenterStaff' && user.bloodCenterId) {
        userCenterId = user.bloodCenterId.toString();
      }

      const result = await BloodInventoryService.getInventoryList({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        bloodType: bloodType as string,
        status: status as string,
        sort: sort as string,
        startDate: startDate as string,
        endDate: endDate as string,
        bloodCenterId: userCenterId
      });

      return res.status(200).json({
        success: true,
        data: result.bags,
        pagination: result.pagination,
        summary: result.summary
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  static async getBloodBagById(req: Request, res: Response) {
    try {
      const bagId = req.params.bagId as string;
      const bag = await BloodInventoryService.getBloodBagById(bagId);
      return res.status(200).json({ success: true, data: bag });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message || 'Blood bag not found' });
    }
  }

  static async updateBagStatus(req: Request, res: Response) {
    try {
      const bagId = req.params.bagId as string;
      const parsed = updateStatusSchema.parse(req.body);
      const staffName = (req as any).user?.fullName || 'BS. Nguyễn Văn A';

      const updated = await BloodInventoryService.updateBagStatus(bagId, parsed.status, parsed.reason, staffName);
      return res.status(200).json({ success: true, message: 'Status updated successfully', data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Bad Request' });
    }
  }

  static async stockInBatch(req: Request, res: Response) {
    try {
      const parsed = stockInBatchSchema.parse(req.body);
      const user = (req as any).user;
      const staffName = user?.fullName || 'BS. Nguyễn Văn A';
      const bloodCenterId = user?.bloodCenterId;

      const created = await BloodInventoryService.stockInBatch(parsed.entries, staffName, bloodCenterId);
      return res.status(201).json({
        success: true,
        message: `Successfully stocked in ${created.length} blood bag(s)`,
        data: created
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Validation Error' });
    }
  }

  static async stockOutBatch(req: Request, res: Response) {
    try {
      const parsed = stockOutSchema.parse(req.body);
      const staffName = (req as any).user?.fullName || 'BS. Nguyễn Văn A';

      const count = await BloodInventoryService.stockOutBatch(parsed, staffName);
      return res.status(200).json({
        success: true,
        message: `Successfully stocked out ${count} blood bag(s)`,
        updatedCount: count
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Bad Request' });
    }
  }

  static async getStatistics(_req: Request, res: Response) {
    try {
      const stats = await BloodInventoryService.getInventoryStatistics();
      return res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }
}
