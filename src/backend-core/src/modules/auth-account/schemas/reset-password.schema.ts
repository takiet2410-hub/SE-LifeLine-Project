// src/modules/auth-account/schemas/reset-password.schema.ts
import { z } from 'zod';

// Schema cho /forgot-password và /resend-forgot-password
export const forgotPasswordSchema = z.object({
  body: z.object({
    idDocumentNumber: z.string().min(1, "ID Document Number is required"),
    email: z.string().email("Invalid email format")
  })
});

// Schema cho /reset-password
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, "Password must include uppercase, lowercase, number, and special character"),
    confirmPassword: z.string().min(1, "Please confirm your password")
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Trỏ lỗi về trường confirmPassword
  })
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];