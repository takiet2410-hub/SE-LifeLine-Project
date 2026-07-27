import { Router } from 'express';
import { BloodInventoryController } from '../controllers/blood-inventory.controller';

const router = Router();

/**
 * @openapi
 * /api/v1/bc/inventory:
 *   get:
 *     summary: Danh sách túi máu trong kho (Phân trang, tìm kiếm & lọc)
 *     tags: [Blood Inventory]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang cần lấy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm mã túi máu (bagCode)
 *       - in: query
 *         name: bloodType
 *         schema:
 *           type: string
 *         description: Lọc theo nhóm máu (A+, A-, B+, B-, AB+, AB-, O+, O-)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái (Available, Reserved, Used, Expired, Discarded)
 *     responses:
 *       200:
 *         description: Lấy danh sách kho máu thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', BloodInventoryController.getInventoryList);

/**
 * @openapi
 * /api/v1/bc/inventory/statistics:
 *   get:
 *     summary: Báo cáo thống kê kho máu & phân bổ nhóm máu
 *     tags: [Blood Inventory]
 *     responses:
 *       200:
 *         description: Lấy dữ liệu thống kê thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/statistics', BloodInventoryController.getStatistics);

/**
 * @openapi
 * /api/v1/bc/inventory/{bagId}:
 *   get:
 *     summary: Xem thông tin chi tiết túi máu
 *     tags: [Blood Inventory]
 *     parameters:
 *       - in: path
 *         name: bagId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID túi máu
 *     responses:
 *       200:
 *         description: Lấy thông tin túi máu thành công
 *       404:
 *         description: Không tìm thấy túi máu
 */
router.get('/:bagId', BloodInventoryController.getBloodBagById);

/**
 * @openapi
 * /api/v1/bc/inventory/{bagId}/status:
 *   put:
 *     summary: Cập nhật trạng thái túi máu (Phân quyền & ghi lịch sử)
 *     tags: [Blood Inventory]
 *     parameters:
 *       - in: path
 *         name: bagId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID túi máu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - reason
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Available, Reserved, Used, Expired, Discarded]
 *               reason:
 *                 type: string
 *                 example: Phục vụ phẫu thuật cấp cứu bệnh viện Chợ Rẫy
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc trạng thái đã ở dạng đóng (terminal)
 */
router.put('/:bagId/status', BloodInventoryController.updateBagStatus);

/**
 * @openapi
 * /api/v1/bc/inventory/stock-in:
 *   post:
 *     summary: Nhập kho máu hàng loạt (Stock In)
 *     tags: [Blood Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entries
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - bloodType
 *                     - volumeMl
 *                     - collectionDate
 *                     - expiryDate
 *                     - storageLocation
 *                   properties:
 *                     bloodType:
 *                       type: string
 *                       enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *                     volumeMl:
 *                       type: number
 *                       example: 350
 *                     collectionDate:
 *                       type: string
 *                       format: date-time
 *                     expiryDate:
 *                       type: string
 *                       format: date-time
 *                     storageLocation:
 *                       type: string
 *                       example: Kệ A-1
 *     responses:
 *       201:
 *         description: Nhập kho máu hàng loạt thành công
 *       400:
 *         description: Lỗi kiểm tra dữ liệu đầu vào
 */
router.post('/stock-in', BloodInventoryController.stockInBatch);

/**
 * @openapi
 * /api/v1/bc/inventory/stock-out:
 *   post:
 *     summary: Xuất kho máu / Hủy túi máu hàng loạt (Stock Out FEFO)
 *     tags: [Blood Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bagIds
 *               - reason
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
 *                 example: Xuất kho cấp cứu Bệnh viện 115
 *     responses:
 *       200:
 *         description: Xuất kho thành công
 *       400:
 *         description: Yêu cầu không hợp lệ
 */
router.post('/stock-out', BloodInventoryController.stockOutBatch);

export default router;
