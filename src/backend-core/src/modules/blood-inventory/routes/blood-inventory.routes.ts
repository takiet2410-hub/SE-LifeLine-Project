import { Router } from 'express';
import { BloodInventoryController } from '../controllers/blood-inventory.controller';
import { authenticateJWT, authorizePermissions, authorizeRoles } from '../../../shared/auth.middleware';

const router = Router();

const staffAuth = [
  authenticateJWT,
  authorizeRoles('BloodCenterStaff', 'Administrator', 'HospitalStaff'),
];
const inventoryRead = [...staffAuth, authorizePermissions('inventory:read')];

/**
 * @openapi
 * /api/v1/bc/inventory:
 *   get:
 *     summary: Danh sách túi máu trong kho (Phân trang, tìm kiếm & lọc)
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: bloodType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', ...inventoryRead, BloodInventoryController.getInventoryList);

/**
 * @openapi
 * /api/v1/bc/inventory/statistics:
 *   get:
 *     summary: Báo cáo thống kê kho máu & phân bổ nhóm máu
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.get('/statistics', ...inventoryRead, BloodInventoryController.getStatistics);

/**
 * @openapi
 * /api/v1/bc/inventory/{bagId}:
 *   get:
 *     summary: Xem thông tin chi tiết túi máu
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:bagId', ...inventoryRead, BloodInventoryController.getBloodBagById);

/**
 * @openapi
 * /api/v1/bc/inventory/{bagId}/status:
 *   put:
 *     summary: Cập nhật trạng thái túi máu (Phân quyền & ghi lịch sử)
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bagId
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
 *               status:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/:bagId/status', ...staffAuth, authorizePermissions('inventory:stock_out'), BloodInventoryController.updateBagStatus);

/**
 * @openapi
 * /api/v1/bc/inventory/stock-in:
 *   post:
 *     summary: Nhập kho máu hàng loạt (Stock In)
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     bloodType:
 *                       type: string
 *                     volumeMl:
 *                       type: number
 *                     collectionDate:
 *                       type: string
 *                     expiryDate:
 *                       type: string
 *                     storageLocation:
 *                       type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/stock-in', ...staffAuth, authorizePermissions('inventory:stock_in'), BloodInventoryController.stockInBatch);

/**
 * @openapi
 * /api/v1/bc/inventory/stock-out:
 *   post:
 *     summary: Xuất kho máu / Hủy túi máu hàng loạt (Stock Out FEFO)
 *     tags: [Blood Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bagIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               reason:
 *                 type: string
 *                 enum: [Dispatch, Disposal, Transfer, Quality Quarantine, Other]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/stock-out', ...staffAuth, authorizePermissions('inventory:stock_out'), BloodInventoryController.stockOutBatch);

export default router;
