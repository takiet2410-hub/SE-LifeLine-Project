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

  let details = null;
  if (err && (err as any).errInfo) {
    details = (err as any).errInfo;
  } else if (err && (err as any).errors) {
    details = (err as any).errors;
  }

  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Internal Server Error',
    details,
  });
};
