import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'Donor' | 'Blood Center Staff' | 'Hospital Staff' | 'Administrator';
  };
}

/**
 * Authentication middleware for Campaign & Shared services
 * Verifies JWT token and attaches user context to the request
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication token required',
      details: {},
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: any };
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired authentication token',
      details: {},
    });
  }
};

/**
 * Authorization middleware
 * Restricts access to specific user roles
 */
export const authorize = (requiredRole: 'Donor' | 'Blood Center Staff' | 'Hospital Staff' | 'Administrator') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {},
      });
      return;
    }

    if (req.user.role !== requiredRole) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        details: { requiredRole },
      });
      return;
    }

    next();
  };
};
