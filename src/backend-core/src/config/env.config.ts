import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(10),
  BREVO_API_KEY: z.string().min(10).optional(),
  SENDER_EMAIL: z.string().email().default('noreply.lifeline@gmail.com'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'), // Đổi thành URL frontend của bạn

  // THÊM 3 DÒNG NÀY VÀO SCHEMA:
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}
export const env = _env.data;