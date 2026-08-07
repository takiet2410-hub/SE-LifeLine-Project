import { Request, Response } from 'express';
import { Hospital } from './models/hospital.model';

export const getHospitals = async (req: Request, res: Response) => {
  try {
    const hospitals = await Hospital.find({ 
      $or: [{ isVerified: true }, { isVerified: { $exists: false } }] 
    }).sort({ name: 1 });
    res.status(200).json({ success: true, data: hospitals });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tải danh sách bệnh viện' });
  }
};
