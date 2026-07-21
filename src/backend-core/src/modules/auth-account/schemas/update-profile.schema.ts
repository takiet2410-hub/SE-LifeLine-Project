import { z } from 'zod';

// src/modules/auth-account/schemas/update-profile.schema.ts
export const updateProfileSchema = z.object({
  body: z.object({
    phoneNumber: z.string().optional(),
    permanentAddress: z.string().optional() // Đổi thành permanentAddress
  }).refine(data => Object.keys(data).length > 0, "At least one field to update must be provided")
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
