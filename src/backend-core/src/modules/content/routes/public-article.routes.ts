import { Router } from 'express';
import { ArticleController } from '../controllers/article.controller';

const router = Router();

/**
 * @openapi
 * /api/v1/articles:
 *   get:
 *     summary: Danh sách bài viết tin tức (Dành cho public News Feed)
 *     tags: [Content Management (Public)]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 */
router.get('/', ArticleController.getPublicArticles);

/**
 * @openapi
 * /api/v1/articles/{articleId}:
 *   get:
 *     summary: Chi tiết bài viết (Dành cho public)
 *     tags: [Content Management (Public)]
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:articleId', ArticleController.getPublicArticleById);

export default router;
