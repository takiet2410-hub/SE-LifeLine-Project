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
    const firstIssue = err.issues?.[0]?.message;
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: firstIssue && firstIssue !== 'Required' && !firstIssue.includes('Invalid') 
        ? firstIssue 
        : `Dữ liệu không hợp lệ: ${err.issues?.[0]?.path?.join('.') || ''} (${firstIssue || 'Invalid'})`,
      details: err.issues,
    });
  }

  const explicitStatus = Number((err as any).statusCode || (err as any).status);
  if (Number.isInteger(explicitStatus) && explicitStatus >= 400 && explicitStatus < 500) {
    const defaultCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
    };
    return res.status(explicitStatus).json({
      code: (err as any).code || defaultCodes[explicitStatus] || 'CLIENT_ERROR',
      message: err.message,
    });
  }

  let details = null;
  if (err && (err as any).errInfo) {
    details = (err as any).errInfo;
  } else if (err && (err as any).errors) {
    details = (err as any).errors;
  }

  const isClientError = err.message && (
    err.message.includes('Invalid credentials') ||
    err.message.includes('Đăng nhập') ||
    err.message.includes('Tài khoản') ||
    err.message.includes('not available') ||
    err.message.includes('Invalid') ||
    err.message.includes('already exists') ||
    (err as any).statusCode === 400
  );

  const isNotFoundError = err.message && (
    err.message.includes('not found') || 
    err.message.includes('Not found') ||
    (err as any).statusCode === 404
  );

  if (isNotFoundError) {
    return res.status(404).json({
      code: 'NOT_FOUND',
      message: err.message || 'Resource not found',
      details,
    });
  }

  if (isClientError) {
    return res.status(400).json({
      code: 'BAD_REQUEST',
      message: err.message,
      details,
    });
  }

  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Internal Server Error',
    details,
  });
};
