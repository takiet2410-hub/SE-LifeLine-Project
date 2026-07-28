import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { User } from '../modules/auth-account/models/user.model';

export interface AuthRequest extends Request {
  user?: any; // Ideally typed to User doc or payload
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid token' });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Token is invalid or expired' });
    }
  } else {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authorization header is missing' });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: `Access denied. Action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
};

