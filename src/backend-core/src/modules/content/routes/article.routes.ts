import { Router } from 'express';
import multer from 'multer';
import { ArticleController } from '../controllers/article.controller';
import { ArticleUploadController } from '../controllers/upload.controller';
import { authenticateJWT, authorizeRoles } from '../../../shared/auth.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();

const staffAuth = [
  authenticateJWT,
  authorizeRoles('BloodCenterStaff', 'Administrator', 'HospitalStaff'),
];

/**
 * @openapi
 * /api/v1/bc/articles:
 *   get:
 *     summary: Danh sách bài viết tin tức & thông báo (Phân trang, lọc, tìm kiếm)
 *     tags: [Content Management]
 */
router.get('/', ...staffAuth, ArticleController.getArticles);

/**
 * @openapi
 * /api/v1/bc/articles/stats/summary:
 *   get:
 *     summary: Báo cáo thống kê Content Management Dashboard
 *     tags: [Content Management]
 */
router.get('/stats/summary', ...staffAuth, ArticleController.getContentStats);

/**
 * @openapi
 * /api/v1/bc/articles/upload-image:
 *   post:
 *     summary: Tải lên ảnh bài viết (Cover image, PNG/JPG max 5MB)
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 */
router.post('/upload-image', ...staffAuth, upload.single('image'), ArticleUploadController.uploadImage);

/**
 * @openapi
 * /api/v1/bc/articles:
 *   post:
 *     summary: Tạo bài viết mới (Draft hoặc Published)
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', ...staffAuth, ArticleController.createArticle);

/**
 * @openapi
 * /api/v1/bc/articles/{articleId}:
 *   get:
 *     summary: Xem chi tiết bài viết & thông số hiệu xuất
 *     tags: [Content Management]
 */
router.get('/:articleId', ...staffAuth, ArticleController.getArticleById);

/**
 * @openapi
 * /api/v1/bc/articles/{articleId}:
 *   put:
 *     summary: Cập nhật thông tin bài viết
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:articleId', ...staffAuth, ArticleController.updateArticle);

/**
 * @openapi
 * /api/v1/bc/articles/{articleId}:
 *   delete:
 *     summary: Xóa bài viết vĩnh viễn
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:articleId', ...staffAuth, ArticleController.deleteArticle);

export default router;
