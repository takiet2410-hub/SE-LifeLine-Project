import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Global error handling middleware
 * Handles ZodError (validation), Mongoose CastError (invalid ObjectId),
 * and custom AppErrors (business rule violations, not found, unauthorized, etc.)
 */
export const errorMiddleware = (
  err: AppError | z.ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof z.ZodError) {
    const details = err.errors.reduce((acc, error) => {
      const pathKeys = error.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params');
      const path = pathKeys.length > 0 ? pathKeys.join('.') : error.path.join('.');
      acc[path] = error.message;
      return acc;
    }, {} as Record<string, unknown>);

    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details,
    });
    return;
  }

  // Invalid ObjectId format passed as :id in the URL (e.g. "BC001" instead of a valid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Resource not found',
      details: {},
    });
    return;
  }

  const appErr = err as AppError;
  const statusCode = appErr.statusCode || 500;
  const code = appErr.code || 'INTERNAL_SERVER_ERROR';
  const message = appErr.message || 'An unexpected error occurred';
  const details = appErr.details || {};

  console.error(`[${code}] ${message}`, details);

  res.status(statusCode).json({
    code,
    message,
    details,
  });
};

export const errorHandler = errorMiddleware;

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};