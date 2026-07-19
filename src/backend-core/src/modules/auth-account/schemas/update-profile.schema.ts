import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    phoneNumber: z.string().optional(),
    address: z.string().optional()
  }).refine(data => Object.keys(data).length > 0, "At least one field to update must be provided")
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
