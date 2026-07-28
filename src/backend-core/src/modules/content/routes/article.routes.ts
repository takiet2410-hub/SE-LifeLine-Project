import { Router } from 'express';
import { ArticleController } from '../controllers/article.controller';
import { ArticleUploadController } from '../controllers/upload.controller';

const router = Router();

/**
 * @openapi
 * /api/v1/bc/articles:
 *   get:
 *     summary: Danh sách bài viết tin tức & thông báo (Phân trang, lọc, tìm kiếm)
 *     tags: [Content Management]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [News, Alert, Educational, Campaign, All]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Published, Scheduled, All]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy danh sách bài viết thành công
 */
router.get('/', ArticleController.getArticles);

/**
 * @openapi
 * /api/v1/bc/articles/stats/summary:
 *   get:
 *     summary: Báo cáo thống kê Content Management Dashboard (Tổng số bài viết, Tiếp cận, Cảnh báo)
 *     tags: [Content Management]
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 */
router.get('/stats/summary', ArticleController.getContentStats);

/**
 * @openapi
 * /api/v1/bc/articles/upload-image:
 *   post:
 *     summary: Tải lên ảnh bài viết (Cover image, PNG/JPG max 5MB)
 *     tags: [Content Management]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageBase64:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upload ảnh thành công, trả về HTTPS URL
 */
router.post('/upload-image', ArticleUploadController.uploadImage);

/**
 * @openapi
 * /api/v1/bc/articles:
 *   post:
 *     summary: Tạo bài viết mới (Draft hoặc Published)
 *     tags: [Content Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Kế hoạch hiến máu khẩn cấp nhóm O+
 *               bodyContent:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [News, Alert, Educational, Campaign]
 *               status:
 *                 type: string
 *                 enum: [Draft, Published, Scheduled]
 *               coverImageUrl:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               targetAudience:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Donors, Staff, Hospitals]
 *     responses:
 *       201:
 *         description: Tạo bài viết thành công
 */
router.post('/', ArticleController.createArticle);

/**
 * @openapi
 * /api/v1/bc/articles/{articleId}:
 *   get:
 *     summary: Xem chi tiết bài viết & thông số hiệu xuất (Performance Analytics)
 *     tags: [Content Management]
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy chi tiết bài viết thành công
 *       404:
 *         description: Không tìm thấy bài viết
 */
router.get('/:articleId', ArticleController.getArticleById);

/**
 * @openapi
 * /api/v1/bc/articles/{articleId}:
 *   put:
 *     summary: Cập nhật thông tin bài viết (Autosave & Inline edit)
 *     tags: [Content Management]
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               bodyContent:
 *                 type: string
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *               coverImageUrl:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *               targetAudience:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:articleId', ArticleController.updateArticle);

/**
 * @openapi
 * /api/v1/bc/articles/{articleId}:
 *   delete:
 *     summary: Xóa bài viết vĩnh viễn (Modal confirmation & Un-publish ngay lập tức)
 *     tags: [Content Management]
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa bài viết thành công
 *       404:
 *         description: Không tìm thấy bài viết
 */
router.delete('/:articleId', ArticleController.deleteArticle);

export default router;
