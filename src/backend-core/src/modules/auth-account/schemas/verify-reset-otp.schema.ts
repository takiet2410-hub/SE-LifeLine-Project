// src/modules/auth-account/schemas/verify-reset-otp.schema.ts
import { z } from 'zod';

export const verifyResetOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
  }),
});

export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>['body'];