import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    dateOfBirth: z.string().refine(date => !isNaN(Date.parse(date)), "Invalid date format"),
    idDocumentNumber: z.string().min(9, "ID must be at least 9 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, "Password must include uppercase, lowercase, number, and special character")
  })
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
