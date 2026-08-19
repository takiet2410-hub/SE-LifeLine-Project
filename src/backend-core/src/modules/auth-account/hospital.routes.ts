import { Router } from 'express';
import { getHospitals } from './hospital.controller';

const router = Router();

/**
 * @openapi
 * /api/v1/hospitals:
 *   get:
 *     summary: Lấy danh sách các bệnh viện đã xác minh
 *     tags: [Hospital]
 *     responses:
 *       200:
 *         description: Danh sách bệnh viện
 */
router.get('/', getHospitals);

export default router;
