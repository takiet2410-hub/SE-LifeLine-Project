// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as any;

      // req.body có thể gán đè trực tiếp
      if (validatedData.body !== undefined) {
        req.body = validatedData.body;
      }
      
      // Sử dụng Object.assign để thay đổi các thuộc tính bên trong thay vì gán đè object
      if (validatedData.query !== undefined && typeof validatedData.query === 'object') {
        Object.assign(req.query, validatedData.query);
      }
      if (validatedData.params !== undefined && typeof validatedData.params === 'object') {
        Object.assign(req.params, validatedData.params);
      }
      
      next();
    } catch (error) {
      console.error('--- [DEBUG] validateRequest Error ---', req.originalUrl, error);
      next(error);
    }
  };
};

export const validateRequest = validate;
