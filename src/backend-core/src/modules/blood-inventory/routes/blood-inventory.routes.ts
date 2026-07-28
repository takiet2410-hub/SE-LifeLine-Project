import { Router } from 'express';
import { BloodInventoryController } from '../controllers/blood-inventory.controller';
import { authenticateJWT, authorizeRoles } from '../../../shared/auth.middleware';

const router = Router();

const staffAuth = [
  authenticateJWT,
  authorizeRoles('BloodCenterStaff', 'Administrator', 'HospitalStaff'),
];

/**
 * @openapi
 * /api/v1/bc/inventory:
 *   get:
 *     summary: Danh sách túi máu trong kho (Phân trang, tìm kiếm & lọc)
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', ...staffAuth, BloodInventoryController.getInventoryList);

/**
 * @openapi
 * /api/v1/bc/inventory/statistics:
 *   get:
 *     summary: Báo cáo thống kê kho máu & phân bổ nhóm máu
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.get('/statistics', ...staffAuth, BloodInventoryController.getStatistics);

/**
 * @openapi
 * /api/v1/bc/inventory/{bagId}:
 *   get:
 *     summary: Xem thông tin chi tiết túi máu
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:bagId', ...staffAuth, BloodInventoryController.getBloodBagById);

/**
 * @openapi
 * /api/v1/bc/inventory/{bagId}/status:
 *   put:
 *     summary: Cập nhật trạng thái túi máu (Phân quyền & ghi lịch sử)
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:bagId/status', ...staffAuth, BloodInventoryController.updateBagStatus);

/**
 * @openapi
 * /api/v1/bc/inventory/stock-in:
 *   post:
 *     summary: Nhập kho máu hàng loạt (Stock In)
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.post('/stock-in', ...staffAuth, BloodInventoryController.stockInBatch);

/**
 * @openapi
 * /api/v1/bc/inventory/stock-out:
 *   post:
 *     summary: Xuất kho máu / Hủy túi máu hàng loạt (Stock Out FEFO)
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.post('/stock-out', ...staffAuth, BloodInventoryController.stockOutBatch);

export default router;
