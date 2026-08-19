import { Router } from 'express';
import { register, login, logout, updateProfile, verifyEmail, assignBloodCenter, updateEmergencyOptIn, updateDonorLocation, getMyProfile, createBloodCenter, getBloodCenters, getBloodCenterById, updateBloodCenter, deleteBloodCenter, createHospital, getHospitalsAdmin, getHospitalByIdAdmin, updateHospital, deleteHospital } from './auth-account.controller';
import { validate } from '../../shared/validate.middleware';
import { authenticateJWT, authorizeRoles } from '../../shared/auth.middleware';

import { registerSchema } from './schemas/register.schema';
import { verifyEmailSchema } from './schemas/verify-email.schema';
import { loginSchema } from './schemas/login.schema';
import { forgotPassword, resendForgotPassword, resetPassword } from './auth-account.controller';
import { forgotPasswordSchema, resetPasswordSchema } from './schemas/reset-password.schema';
import { updateProfileSchema, assignBloodCenterSchema, emergencyOptInSchema, updateDonorLocationSchema, createBloodCenterSchema, updateBloodCenterSchema, createHospitalSchema, updateHospitalSchema } from './schemas/update-profile.schema';
import { verifyResetOtp } from './auth-account.controller';


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
 *     summary: Login to the application with optional role selection
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idDocumentNumber
 *               - password
 *             properties:
 *               idDocumentNumber:
 *                 type: string
 *                 description: Số CCCD 12 chữ số
 *                 example: "079099000111"
 *               password:
 *                 type: string
 *                 description: Mật khẩu người dùng
 *                 example: "StrongPass123!"
 *               role:
 *                 type: string
 *                 enum: [Donor, BloodCenterStaff, HospitalStaff, Administrator]
 *                 description: Vai trò muốn chọn đăng nhập vào hệ thống (Tùy chọn)
 *                 example: "BloodCenterStaff"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT access token and active user role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "6a6b023e654f08d426e971e8"
 *                     email:
 *                       type: string
 *                       example: "staff.bloodcenter@lifeline.gov.vn"
 *                     idDocumentNumber:
 *                       type: string
 *                       example: "079099000111"
 *                     role:
 *                       type: string
 *                       example: "BloodCenterStaff"
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["BloodCenterStaff"]
 *       400:
 *         description: Invalid credentials or unauthorized role requested
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
 *               email:
 *                 type: string
 *                 example: "newemail@example.com"
 *               phoneNumber:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *                 description: "URL ảnh đại diện sau khi Frontend upload lên Cloudinary"
 *               permanentAddress:
 *                 type: object
 *                 properties:
 *                   province:
 *                     type: string
 *                   ward:
 *                     type: string
 *                   street:
 *                     type: string
 *               currentAddress:
 *                 type: object
 *                 properties:
 *                   province:
 *                     type: string
 *                   ward:
 *                     type: string
 *                   street:
 *                     type: string
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

/**
 * @openapi
 * /api/v1/users/me/blood-center:
 *   patch:
 *     summary: BloodCenterStaff tự gán trung tâm máu
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bloodCenterId]
 *             properties:
 *               bloodCenterId:
 *                 type: string
 *                 description: ID của trung tâm máu (MongoDB ObjectId)
 *                 example: "65f1a2b3c4d5e6f7a8b9c001"
 *     responses:
 *       200:
 *         description: Assigned blood center successfully
 *       403:
 *         description: Forbidden - Only BloodCenterStaff can assign
 *       404:
 *         description: Blood center not found
 */
router.patch('/me/blood-center', authenticateJWT, authorizeRoles('BloodCenterStaff'), validate(assignBloodCenterSchema), assignBloodCenter);

/**
 * @openapi
 * /api/v1/users/me/emergency-opt-in:
 *   patch:
 *     summary: Donor bật/tắt nhận thông báo SOS khẩn cấp
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emergencyOptIn]
 *             properties:
 *               emergencyOptIn:
 *                 type: boolean
 *                 description: true = bật nhận SOS, false = tắt
 *                 example: true
 *     responses:
 *       200:
 *         description: Updated emergency opt-in preference
 *       403:
 *         description: Forbidden - Only Donor can update
 *       404:
 *         description: Donor profile not found
 */
router.patch('/me/emergency-opt-in', authenticateJWT, authorizeRoles('Donor'), validate(emergencyOptInSchema), updateEmergencyOptIn);

/**
 * @openapi
 * /api/v1/users/me/location:
 *   patch:
 *     summary: Donor cập nhật vị trí (cho SOS geoNear)
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [location]
 *             properties:
 *               location:
 *                 type: object
 *                 required: [type, coordinates]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                     example: "Point"
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *                     example: [106.660172, 10.755498]
 *     responses:
 *       200:
 *         description: Location updated
 *       403:
 *         description: Forbidden - Only Donor can update
 *       404:
 *         description: Donor profile not found
 */
router.patch('/me/location', authenticateJWT, authorizeRoles('Donor'), validate(updateDonorLocationSchema), updateDonorLocation);

// ========== BLOOD CENTER CRUD (Administrator) ==========
/**
 * @openapi
 * /api/v1/admin/blood-centers:
 *   post:
 *     summary: Tạo trung tâm máu mới
 *     tags: [Admin - Blood Centers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, location, contactPhone, operatingHours]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Trung tâm Huyết học TP.HCM"
 *               address:
 *                 type: string
 *                 example: "118 Hồng Bàng, Quận 5, TP.HCM"
 *               location:
 *                 type: object
 *                 required: [type, coordinates]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                     example: "Point"
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [106.6627, 10.7555]
 *               contactPhone:
 *                 type: string
 *                 example: "02839571342"
 *               operatingHours:
 *                 type: string
 *                 example: "07:00 - 16:00"
 *     responses:
 *       201:
 *         description: Blood center created
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/admin/blood-centers', authenticateJWT, authorizeRoles('Administrator'), validate(createBloodCenterSchema), createBloodCenter);

/**
 * @openapi
 * /api/v1/admin/blood-centers:
 *   get:
 *     summary: Danh sách trung tâm máu
 *     tags: [Admin - Blood Centers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blood centers
 */
router.get('/admin/blood-centers', authenticateJWT, authorizeRoles('Administrator'), getBloodCenters);

/**
 * @openapi
 * /api/v1/admin/blood-centers/{id}:
 *   get:
 *     summary: Chi tiết trung tâm máu
 *     tags: [Admin - Blood Centers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blood center details
 *       404:
 *         description: Not found
 */
router.get('/admin/blood-centers/:id', authenticateJWT, authorizeRoles('Administrator'), getBloodCenterById);

/**
 * @openapi
 * /api/v1/admin/blood-centers/{id}:
 *   patch:
 *     summary: Cập nhật trung tâm máu
 *     tags: [Admin - Blood Centers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated blood center
 *       404:
 *         description: Not found
 */
router.patch('/admin/blood-centers/:id', authenticateJWT, authorizeRoles('Administrator'), validate(updateBloodCenterSchema), updateBloodCenter);

/**
 * @openapi
 * /api/v1/admin/blood-centers/{id}:
 *   delete:
 *     summary: Xóa trung tâm máu
 *     tags: [Admin - Blood Centers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete('/admin/blood-centers/:id', authenticateJWT, authorizeRoles('Administrator'), deleteBloodCenter);

// ========== HOSPITAL CRUD (Administrator) ==========
/**
 * @openapi
 * /api/v1/admin/hospitals:
 *   post:
 *     summary: Tạo bệnh viện mới
 *     tags: [Admin - Hospitals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Hospital created
 */
router.post('/admin/hospitals', authenticateJWT, authorizeRoles('Administrator'), validate(createHospitalSchema), createHospital);

/**
 * @openapi
 * /api/v1/admin/hospitals:
 *   get:
 *     summary: Danh sách bệnh viện (admin - tất cả, không filter isVerified)
 *     tags: [Admin - Hospitals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of hospitals
 */
router.get('/admin/hospitals', authenticateJWT, authorizeRoles('Administrator'), getHospitalsAdmin);

/**
 * @openapi
 * /api/v1/admin/hospitals/{id}:
 *   get:
 *     summary: Chi tiết bệnh viện
 *     tags: [Admin - Hospitals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hospital details
 */
router.get('/admin/hospitals/:id', authenticateJWT, authorizeRoles('Administrator'), getHospitalByIdAdmin);

/**
 * @openapi
 * /api/v1/admin/hospitals/{id}:
 *   patch:
 *     summary: Cập nhật bệnh viện (kể cả isVerified)
 *     tags: [Admin - Hospitals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated hospital
 */
router.patch('/admin/hospitals/:id', authenticateJWT, authorizeRoles('Administrator'), validate(updateHospitalSchema), updateHospital);

/**
 * @openapi
 * /api/v1/admin/hospitals/{id}:
 *   delete:
 *     summary: Xóa bệnh viện
 *     tags: [Admin - Hospitals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/admin/hospitals/:id', authenticateJWT, authorizeRoles('Administrator'), deleteHospital);

export default router;
