import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticateJWT } from '../../../shared/auth.middleware';
import { validateRequest } from '../../../shared/validate.middleware';
import { SearchLocationSchema } from '../schemas/search-location.schema';
import { CreateAppointmentSchema } from '../schemas/create-appointment.schema';
import { CancelAppointmentSchema } from '../schemas/cancel-appointment.schema';
import { DownloadTicketSchema } from '../schemas/download-ticket.schema';
const router = Router();

/**
 * @openapi
 * /api/v1/bookings/locations:
 *   get:
 *     summary: Danh sách địa điểm hiến máu
 *     tags: [Booking]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Lấy danh sách địa điểm thành công
 */
router.get('/locations', validateRequest(SearchLocationSchema), BookingController.listLocations);

/**
 * @openapi
 * /api/v1/bookings/appointments:
 *   post:
 *     summary: Đặt lịch hẹn hiến máu
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               campaignId:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *               timeSlot:
 *                 type: string
 *               answers:
 *                 type: object
 *                 properties:
 *                   responses:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         questionId:
 *                           type: string
 *                         selectedOptions:
 *                           type: array
 *                           items:
 *                             type: string
 *                         description:
 *                           type: string
 *     responses:
 *       201:
 *         description: Tạo lịch hẹn thành công
 *       403:
 *         description: Lỗi điều kiện 84 ngày hoặc screening
 *       409:
 *         description: Trùng lịch hoặc chiến dịch đã đầy
 */
router.post('/appointments', authenticateJWT, validateRequest(CreateAppointmentSchema), BookingController.createAppointment);

/**
 * @openapi
 * /api/v1/bookings/appointments:
 *   get:
 *     summary: Danh sách lịch hẹn hiến máu
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/appointments', authenticateJWT, BookingController.listAppointments);

/**
 * @openapi
 * /api/v1/bookings/appointments/{id}:
 *   get:
 *     summary: Xem chi tiết lịch hẹn
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/appointments/:id', authenticateJWT, BookingController.getAppointmentById);

/**
 * @openapi
 * /api/v1/bookings/appointments/{id}/cancel:
 *   patch:
 *     summary: Hủy lịch hẹn
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       403:
 *         description: Quá hạn hủy lịch
 *       404:
 *         description: Không tìm thấy lịch hẹn
 */
router.patch('/appointments/:id/cancel', authenticateJWT, validateRequest(CancelAppointmentSchema), BookingController.cancelAppointment);

/**
 * @openapi
 * /api/v1/bookings/appointments/{id}/e-ticket:
 *   get:
 *     summary: Tải E-ticket
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/appointments/:id/e-ticket', authenticateJWT, validateRequest(DownloadTicketSchema), BookingController.downloadETicket);

/**
 * @openapi
 * /api/v1/bookings/appointments/{id}/sync-bloodcenter:
 *   post:
 *     summary: Gửi thông tin lịch hẹn và form sàng lọc sang BloodCenter
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đồng bộ thành công
 *       404:
 *         description: Không tìm thấy lịch hẹn
 */
router.post('/appointments/:id/sync-bloodcenter', authenticateJWT, BookingController.syncToBloodCenter);

/**
 * @openapi
 * /api/v1/bookings/appointments/{id}/confirm:
 *   post:
 *     summary: BloodCenter xác nhận lịch hẹn và tạo e-ticket cho người dùng
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xác nhận thành công và tạo e-ticket
 *       404:
 *         description: Không tìm thấy lịch hẹn
 */
router.post('/appointments/:id/confirm', authenticateJWT, BookingController.confirmAppointment);

export default router;