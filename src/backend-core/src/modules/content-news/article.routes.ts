import { Router, Request, Response, NextFunction } from 'express';
import articleController from './article.controller';
import { authenticate, authorize } from '../../shared/auth.middleware';
import { validate } from '../../shared/validate.middleware';
import { createArticleSchema, updateArticleSchema, articleQuerySchema } from './schemas/article.schema';

import { uploadMiddleware, handleUploadError } from './upload.middleware';

const router = Router();

/**
 * @openapi
 * /api/v1/articles:
 *   post:
 *     summary: Create a new article
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - bodyContent
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: Emergency O- Blood Shortage
 *               bodyContent:
 *                 type: string
 *                 example: Urgent call for O- blood donors at Central Blood Bank...
 *               category:
 *                 type: string
 *                 enum: [News, Alert, Educational]
 *                 example: Alert
 *               status:
 *                 type: string
 *                 enum: [Draft, Published]
 *                 default: Draft
 *                 example: Published
 *               targetAudience:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Donors, Staff, Hospitals]
 *                 example: [Donors, Hospitals]
 *               featuredMediaUrl:
 *                 type: string
 *                 example: https://res.cloudinary.com/lifeline/image/upload/v1/banner.jpg
 *     responses:
 *       201:
 *         description: Article created successfully
 *       400:
 *         description: Validation error (e.g. missing title or missing target audience when publishing)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Blood Center Staff role
 */
router.post(
  '/',
  authenticate,
  authorize('Blood Center Staff'),
  validate(createArticleSchema),
  (req: Request, res: Response, next: NextFunction) => {
    articleController.createArticle(req, res, next);
  }
);

/**
 * @openapi
 * /api/v1/articles/upload-media:
 *   post:
 *     summary: Upload featured media image for articles
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PNG, JPG, or JPEG image file (max 5MB)
 *     responses:
 *       201:
 *         description: Image uploaded successfully to Cloudinary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: https://res.cloudinary.com/demo/image/upload/v1234567890/lifeline/articles/sample.png
 *       400:
 *         description: Validation error (no file provided, invalid MIME type, or file size exceeds 5MB limit)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Blood Center Staff role
 */
router.post(
  '/upload-media',
  authenticate,
  authorize('Blood Center Staff'),
  uploadMiddleware,
  handleUploadError,
  (req: Request, res: Response, next: NextFunction) => {
    articleController.uploadMedia(req, res, next);
  }
);

/**
 * @openapi
 * /api/v1/articles:
 *   get:
 *     summary: Retrieve paginated article list
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of articles per page (default 12)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [News, Alert, Educational]
 *         description: Filter articles by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Published]
 *         description: Filter articles by status
 *     responses:
 *       200:
 *         description: Paginated list of articles with total count and total pages metadata
 *       400:
 *         description: Invalid query parameters
 */
router.get(
  '/',
  validate(articleQuerySchema),
  (req: Request, res: Response, next: NextFunction) => {
    articleController.getArticles(req, res, next);
  }
);

/**
 * @openapi
 * /api/v1/articles/stats:
 *   get:
 *     summary: Retrieve article dashboard statistics
 *     tags:
 *       - Articles
 *     responses:
 *       200:
 *         description: Dashboard metrics summary (Total Articles, Public Reach, Active Alerts)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalArticles:
 *                   type: integer
 *                   example: 24
 *                 publicReach:
 *                   type: integer
 *                   example: 4200
 *                 activeAlerts:
 *                   type: integer
 *                   example: 3
 */
router.get(
  '/stats',
  (req: Request, res: Response, next: NextFunction) => {
    articleController.getArticleStats(req, res, next);
  }
);

/**
 * @openapi
 * /api/v1/articles/{id}:
 *   get:
 *     summary: Retrieve an article by ID
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique Article ID
 *     responses:
 *       200:
 *         description: Article details
 *       404:
 *         description: Article not found or deleted
 */
router.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    articleController.getArticleById(req, res, next);
  }
);

/**
 * @openapi
 * /api/v1/articles/{id}:
 *   patch:
 *     summary: Update an existing article / toggle status
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique Article ID
 *     requestBody:
 *       required: true
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
 *                 enum: [News, Alert, Educational]
 *               status:
 *                 type: string
 *                 enum: [Draft, Published]
 *               targetAudience:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Donors, Staff, Hospitals]
 *               featuredMediaUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Article updated successfully
 *       400:
 *         description: Validation or business rule error (e.g. server-managed property edit attempt)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Article not found
 */
router.patch(
  '/:id',
  authenticate,
  authorize('Blood Center Staff'),
  validate(updateArticleSchema),
  (req: Request, res: Response, next: NextFunction) => {
    articleController.updateArticle(req, res, next);
  }
);

/**
 * @openapi
 * /api/v1/articles/{id}:
 *   delete:
 *     summary: Soft-delete an article
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique Article ID
 *     responses:
 *       200:
 *         description: Article soft-deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Article not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize('Blood Center Staff'),
  (req: Request, res: Response, next: NextFunction) => {
    articleController.deleteArticle(req, res, next);
  }
);

export default router;
