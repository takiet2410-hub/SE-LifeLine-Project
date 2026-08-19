import { Request, Response, NextFunction } from 'express';
import { AuthAccountService } from './auth-account.service';
import { BloodCenter } from './models/blood-center.model';
import { DonorProfile } from './models/donor-profile.model';
import { Hospital } from './models/hospital.model';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.verifyEmail(req.body.token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.forgotPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resendForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.resendForgotPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyResetOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.verifyResetOtp(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.resetPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.updateProfile(req.user._id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.getProfile(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// BloodCenterStaff tự gán bloodCenterId
export const assignBloodCenter = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { bloodCenterId } = req.body;

    // Chỉ cho phép BloodCenterStaff tự gán cho mình
    if (req.user.role !== 'BloodCenterStaff') {
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'Chỉ BloodCenterStaff mới có thể gán trung tâm máu' 
      });
    }

    // Verify blood center exists
    const bloodCenter = await BloodCenter.findById(bloodCenterId);
    if (!bloodCenter) {
      return res.status(404).json({ 
        code: 'NOT_FOUND', 
        message: 'Không tìm thấy trung tâm máu' 
      });
    }

    // Update user
    const User = (await import('./models/user.model')).User;
    const user = await User.findByIdAndUpdate(
      userId,
      { bloodCenterId, role: 'BloodCenterStaff' },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Đã gán trung tâm máu thành công',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Donor bật/tắt nhận SOS khẩn cấp
export const updateEmergencyOptIn = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { emergencyOptIn } = req.body;

    // Chỉ cho phép Donor tự bật/tắt cho mình
    if (req.user.role !== 'Donor') {
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'Chỉ Donor mới có thể thay đổi cài đặt nhận SOS' 
      });
    }

    const donorProfile = await DonorProfile.findOneAndUpdate(
      { userId },
      { emergencyOptIn },
      { returnDocument: 'after' }
    );

    if (!donorProfile) {
      return res.status(404).json({ 
        code: 'NOT_FOUND', 
        message: 'Không tìm thấy hồ sơ người hiến máu' 
      });
    }

    res.status(200).json({
      success: true,
      message: emergencyOptIn ? 'Đã bật nhận thông báo SOS khẩn cấp' : 'Đã tắt nhận thông báo SOS khẩn cấp',
      data: { emergencyOptIn: donorProfile.emergencyOptIn },
    });
  } catch (error) {
    next(error);
  }
};

// Donor cập nhật vị trí (cho SOS geoNear)
export const updateDonorLocation = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { location } = req.body;

    if (req.user.role !== 'Donor') {
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'Chỉ Donor mới có thể cập nhật vị trí' 
      });
    }

    const donorProfile = await DonorProfile.findOneAndUpdate(
      { userId },
      { location },
      { returnDocument: 'after' }
    );

    if (!donorProfile) {
      return res.status(404).json({ 
        code: 'NOT_FOUND', 
        message: 'Không tìm thấy hồ sơ người hiến máu' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật vị trí',
      data: { location: donorProfile.location },
    });
  } catch (error) {
    next(error);
  }
};

// ========== BLOOD CENTER CRUD (Administrator) ==========
export const createBloodCenter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bloodCenter = await BloodCenter.create(req.body);
    res.status(201).json({ success: true, data: bloodCenter });
  } catch (error) {
    next(error);
  }
};

export const getBloodCenters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bloodCenters = await BloodCenter.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bloodCenters });
  } catch (error) {
    next(error);
  }
};

export const getBloodCenterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bloodCenter = await BloodCenter.findById(req.params.id);
    if (!bloodCenter) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trung tâm máu' });
    }
    res.status(200).json({ success: true, data: bloodCenter });
  } catch (error) {
    next(error);
  }
};

export const updateBloodCenter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bloodCenter = await BloodCenter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!bloodCenter) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trung tâm máu' });
    }
    res.status(200).json({ success: true, data: bloodCenter });
  } catch (error) {
    next(error);
  }
};

export const deleteBloodCenter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bloodCenter = await BloodCenter.findByIdAndDelete(req.params.id);
    if (!bloodCenter) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trung tâm máu' });
    }
    res.status(200).json({ success: true, message: 'Đã xóa trung tâm máu' });
  } catch (error) {
    next(error);
  }
};

// ========== HOSPITAL CRUD (Administrator) ==========
export const createHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

export const getHospitalsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await Hospital.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: hospitals });
  } catch (error) {
    next(error);
  }
};

export const getHospitalByIdAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh viện' });
    }
    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

export const updateHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh viện' });
    }
    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

export const deleteHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh viện' });
    }
    res.status(200).json({ success: true, message: 'Đã xóa bệnh viện' });
  } catch (error) {
    next(error);
  }
};