import { Router } from 'express';
import { register, login, logout, updateProfile, verifyEmail } from './auth-account.controller';
import { validate } from '../../shared/validate.middleware';
import { authenticateJWT } from '../../shared/auth.middleware';

import { registerSchema } from './schemas/register.schema';
import { verifyEmailSchema } from './schemas/verify-email.schema';
import { loginSchema } from './schemas/login.schema';
import { forgotPassword, resendForgotPassword, resetPassword } from './auth-account.controller';
import { forgotPasswordSchema, resetPasswordSchema } from './schemas/reset-password.schema';
import { updateProfileSchema } from './schemas/update-profile.schema';
import { verifyResetOtp } from './auth-account.controller';
import { getMyProfile } from './auth-account.controller';


const router = Router();

/**
 * @openapi
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user via CCCD QR Scan
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrPayload:
 *                 type: string
 *                 description: Chuỗi văn bản thuần được giải mã từ QR CCCD
 *                 example: "079099000123||NGUYEN VAN A|01012000|Nam|123 Duong ABC, Phuong XYZ, Quan 1, TP HCM|01012021"
 *               phoneNumber:
 *                 type: string
 *                 example: "0901234567"
 *               email:
 *                 type: string
 *                 example: "donor@example.com"
 *               password:
 *                 type: string
 *                 example: "StrongPass123!"
 *     responses:
 *       201:
 *         description: User registered successfully, pending verification
 */
router.post('/register', validate(registerSchema), register);

/**
 * @openapi
 * /api/v1/users/verify-email:
 *   post:
 *     summary: Verify email using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account verified successfully
 */
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);

/**
 * @openapi
 * /api/v1/users/login:
 *   post:
 *     summary: Login to the application
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idDocumentNumber:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', validate(loginSchema), login);

/**
 * @openapi
 * /api/v1/users/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authenticateJWT, logout);

/**
 * @openapi
 * /api/v1/users/forgot-password:
 *   post:
 *     summary: Request a password reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idDocumentNumber:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset token sent to email
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

/**
 * @openapi
 * /api/v1/users/resend-forgot-password:
 *   post:
 *     summary: Resend password reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idDocumentNumber:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: New reset token sent to email
 */
router.post('/resend-forgot-password', validate(forgotPasswordSchema), resendForgotPassword);


/**
 * @openapi
 * /api/v1/users/verify-reset-otp:
 *   post:
 *     summary: Verify the 6-digit OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "donor@example.com"
 *               otp:
 *                 type: string
 *                 description: "Mã OTP 6 chữ số lấy từ email"
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully, returns a reset token for the next step
 */
router.post('/verify-reset-otp', verifyResetOtp); // Nếu bạn có viết middleware validate cho API này, hãy nhớ thêm nó vào đây nhé

/**
 * @openapi
 * /api/v1/users/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

/**
 * @openapi
 * /api/v1/users/profile:
 *   patch:
 *     summary: Update profile
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch('/profile', authenticateJWT, validate(updateProfileSchema), updateProfile);

/**
 * @openapi
 * /api/v1/users/profile:
 *   get:
 *     summary: Get current donor profile with donation stats
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 */
router.get('/profile', authenticateJWT, getMyProfile);

export default router;
