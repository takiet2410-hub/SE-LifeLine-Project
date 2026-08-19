import { Router } from 'express';
import multer from 'multer';
import { ArticleController } from '../controllers/article.controller';
import { ArticleUploadController } from '../controllers/upload.controller';
import { authenticateJWT, authorizePermissions, authorizeRoles } from '../../../shared/auth.middleware';
import { requireFeatureEnabled } from '../../admin/feature-toggle.middleware';
import { validateRequest } from '../../../shared/validate.middleware';
import { GetArticleByIdSchema, QueryArticleListSchema } from '../schemas/article.schema';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();
const newsFeature = requireFeatureEnabled('news_content_portal');

const staffRoles = authorizeRoles('BloodCenterStaff', 'Administrator', 'HospitalStaff');
const publishPermissionWhenRequested = (req: any, res: any, next: any) => {
  if (!['Published', 'Scheduled'].includes(req.body?.status)) return next();
  return authorizePermissions('content:publish')(req, res, next);
};

/**
 * @openapi
 * /api/v1/bc/articles:
 *   get:
 *     summary: Danh sách bài viết tin tức & thông báo (Phân trang, lọc, tìm kiếm)
 *     tags: [Content Management]
 */
router.get('/', authenticateJWT, newsFeature, staffRoles, authorizePermissions('content:read'), validateRequest(QueryArticleListSchema), ArticleController.getArticles);

/**
 * @openapi
 * /api/v1/bc/articles/stats/summary:
 *   get:
 *     summary: Báo cáo thống kê Content Management Dashboard
 *     tags: [Content Management]
 */
router.get('/stats/summary', authenticateJWT, newsFeature, staffRoles, authorizePermissions('content:read'), ArticleController.getContentStats);

/**
 * @openapi
 * /api/v1/bc/articles/upload-image:
 *   post:
 *     summary: Tải lên ảnh bài viết (Cover image, PNG/JPG max 5MB)
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 */
router.post('/upload-image', authenticateJWT, newsFeature, staffRoles, authorizePermissions('content:create'), upload.single('image'), ArticleUploadController.uploadImage);

/**
 * @openapi
 * /api/v1/bc/articles:
 *   post:
 *     summary: Tạo bài viết mới (Draft hoặc Published)
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateJWT, newsFeature, staffRoles, authorizePermissions('content:create'), publishPermissionWhenRequested, ArticleController.createArticle);

/**
 * @openapi
 * /api/v1/bc/articles/{articleId}:
 *   get:
 *     summary: Xem chi tiết bài viết & thông số hiệu xuất
 *     tags: [Content Management]
 */
router.get('/:articleId', authenticateJWT, newsFeature, staffRoles, authorizePermissions('content:read'), validateRequest(GetArticleByIdSchema), ArticleController.getArticleById);

/**
 * @openapi
 * /api/v1/bc/articles/{articleId}:
 *   put:
 *     summary: Cập nhật thông tin bài viết
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:articleId', authenticateJWT, newsFeature, staffRoles, authorizePermissions('content:create'), publishPermissionWhenRequested, ArticleController.updateArticle);

/**
 * @openapi
 * /api/v1/bc/articles/{articleId}:
 *   delete:
 *     summary: Xóa bài viết vĩnh viễn
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:articleId', authenticateJWT, newsFeature, staffRoles, authorizePermissions('content:create'), validateRequest(GetArticleByIdSchema), ArticleController.deleteArticle);

export default router;
