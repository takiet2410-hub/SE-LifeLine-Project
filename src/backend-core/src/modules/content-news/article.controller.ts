import { Request, Response, NextFunction } from 'express';
import articleService from './article.service';
import { AuditLogger } from '../../shared/audit/audit-logger';
import { AppError } from '../../shared/error.middleware';

export class ArticleController {
  /**
   * POST /api/v1/articles
   * Create a new article
   */
  async createArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || 'system';
      const article = await articleService.createArticle(req.body, actorId);

      await AuditLogger.log({
        actorId,
        action: 'CREATE_ARTICLE',
        targetId: article._id.toString(),
        targetType: 'Article',
        details: {
          title: article.title,
          category: article.category,
          status: article.status,
        },
      });

      res.status(201).json(article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/articles
   * Retrieve all articles with pagination and filtering
   */
  async getArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
      const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10) || 12) : 12;
      const category = req.query.category as 'News' | 'Alert' | 'Educational' | undefined;
      const status = req.query.status as 'Draft' | 'Published' | undefined;

      const result = await articleService.getAllArticles({ page, limit, category, status });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/articles/stats
   * Retrieve article dashboard statistics
   */
  async getArticleStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await articleService.getArticleStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/articles/:id
   * Retrieve an article by ID
   */
  async getArticleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const article = await articleService.getArticleById(id);

      if (!article) {
        const error: AppError = new Error(`Article with ID ${id} not found`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }

      res.status(200).json(article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/articles/:id
   * Update an article / toggle status
   */
  async updateArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Reject updates to server-managed properties
      const serverManagedFields = ['createdAt', 'updatedAt', 'deletedAt', 'viewCount', 'reachCount', '_id', 'id'];
      for (const field of serverManagedFields) {
        if (field in req.body) {
          const error: AppError = new Error(`Updates to server-managed property ${field} are not allowed`);
          error.statusCode = 400;
          error.code = 'BUSINESS_RULE_VIOLATION';
          error.details = { field };
          return next(error);
        }
      }

      const existingArticle = await articleService.getArticleById(id);
      if (!existingArticle) {
        const error: AppError = new Error(`Article with ID ${id} not found`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }

      const updatedArticle = await articleService.updateArticle(id, req.body);
      if (!updatedArticle) {
        const error: AppError = new Error(`Article with ID ${id} not found`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }

      const actorId = (req as any).user?.id || 'system';
      const isUnpublishing = existingArticle.status === 'Published' && updatedArticle.status === 'Draft';
      const action = isUnpublishing ? 'UNPUBLISH_ARTICLE' : 'UPDATE_ARTICLE';

      await AuditLogger.log({
        actorId,
        action,
        targetId: updatedArticle._id.toString(),
        targetType: 'Article',
        details: {
          updatedFields: Object.keys(req.body),
          previousStatus: existingArticle.status,
          newStatus: updatedArticle.status,
        },
      });

      res.status(200).json(updatedArticle);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/articles/:id
   * Soft-delete an article
   */
  async deleteArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const existingArticle = await articleService.getArticleById(id);
      if (!existingArticle) {
        const error: AppError = new Error(`Article with ID ${id} not found`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }

      const deletedArticle = await articleService.deleteArticle(id);
      if (!deletedArticle) {
        const error: AppError = new Error(`Article with ID ${id} not found`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }

      const actorId = (req as any).user?.id || 'system';
      await AuditLogger.log({
        actorId,
        action: 'DELETE_ARTICLE',
        targetId: deletedArticle._id.toString(),
        targetType: 'Article',
        details: {
          title: deletedArticle.title,
          category: deletedArticle.category,
        },
      });

      res.status(200).json({
        message: 'Article deleted successfully',
        id: deletedArticle._id.toString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/articles/upload-media
   * Upload featured media image for articles
   */
  async uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        const error: AppError = new Error('No image file provided');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        error.details = { field: 'file' };
        return next(error);
      }

      const result = await articleService.uploadArticleMedia(req.file.buffer);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ArticleController();
