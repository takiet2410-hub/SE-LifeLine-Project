import { z } from 'zod';

export const resetPasswordRequestSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format")
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().min(6, "OTP must be 6 characters").max(6, "OTP must be 6 characters"),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, "Password must include uppercase, lowercase, number, and special character")
  })
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
