import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: err.issues,
    });
  }

  // Handle mongoose errors, jwt errors, etc. here if needed
  
  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Internal Server Error',
    details: null,
  });
};
