import { authenticate, authorize, AuthenticatedRequest } from './auth.middleware';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';

describe('Shared Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('authenticate middleware', () => {
    it('should return 401 if authorization header is missing', () => {
      mockRequest.headers = {};

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Authentication token required',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authentication token',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should succeed and set user context if token is valid', () => {
      const payload = { id: 'user-123', role: 'Blood Center Staff' };
      const token = jwt.sign(payload, env.JWT_SECRET);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe('user-123');
      expect(mockRequest.user?.role).toBe('Blood Center Staff');
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should return 401 if req.user is missing', () => {
      const middleware = authorize('Blood Center Staff');

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user role does not match required role', () => {
      const middleware = authorize('Blood Center Staff');
      mockRequest.user = {
        id: 'user-123',
        role: 'Donor',
      };

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should succeed and call next if user role matches required role', () => {
      const middleware = authorize('Blood Center Staff');
      mockRequest.user = {
        id: 'user-123',
        role: 'Blood Center Staff',
      };

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
