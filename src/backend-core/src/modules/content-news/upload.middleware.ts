import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/error.middleware';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PNG and JPG/JPEG images are allowed.') as any;
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    cb(error);
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
}).single('file');

export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const error: AppError = new Error('File size exceeds maximum allowed limit of 5MB');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = { field: 'file' };
      return next(error);
    }
    const error: AppError = new Error(err.message);
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }
  next(err);
};
