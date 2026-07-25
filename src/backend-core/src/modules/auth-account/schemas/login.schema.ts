import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    idDocumentNumber: z.string().min(1, "ID Document Number is required"),
    password: z.string().min(1, "Password is required")
  })
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
