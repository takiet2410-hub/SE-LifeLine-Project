import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/auth.middleware';

export const requireStaffRole = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  const role = req.user.role;
  if (role === 'BloodCenterStaff' || role === 'Administrator') {
    return next();
  }

  return res.status(403).json({
    code: 'FORBIDDEN',
    message: 'Insufficient permissions to access donor registration data'
  });
};
