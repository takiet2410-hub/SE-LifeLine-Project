// src/modules/auth-account/schemas/register.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    qrPayload: z.string().min(1, "QR payload is required"),
    phoneNumber: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, "Invalid phone number format"), // Regex kiểm tra SĐT Việt Nam
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, "Password must include uppercase, lowercase, number, and special character")
  })
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];