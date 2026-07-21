import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as any;

      if (validatedData.body !== undefined) {
        req.body = validatedData.body;
      }
      if (validatedData.query !== undefined && typeof validatedData.query === 'object') {
        Object.assign(req.query, validatedData.query);
      }
      if (validatedData.params !== undefined && typeof validatedData.params === 'object') {
        Object.assign(req.params, validatedData.params);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateRequest = validate;
