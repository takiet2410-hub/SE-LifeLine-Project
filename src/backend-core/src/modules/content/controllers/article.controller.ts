import { Request, Response } from 'express';
import { ArticleService } from '../services/article.service';
import { CreateArticleSchema, UpdateArticleSchema } from '../schemas/article.schema';

export class ArticleController {
  static async getArticles(req: Request, res: Response) {
    try {
      const { page, limit, category, status, search } = req.query;
      const result = await ArticleService.getArticleList({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        category: category as string,
        status: status as string,
        search: search as string
      });

      return res.status(200).json({
        success: true,
        data: result.articles,
        pagination: result.pagination,
        summary: result.summary
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  static async getArticleById(req: Request, res: Response) {
    try {
      const articleId = req.params.articleId as string;
      const isPublic = req.query.isPublic === 'true';
      const article = await ArticleService.getArticleById(articleId, isPublic);

      return res.status(200).json({
        success: true,
        data: article
      });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message || 'Article not found' });
    }
  }

  static async getPublicArticles(req: Request, res: Response) {
    try {
      const { page, limit, category, search } = req.query;
      const result = await ArticleService.getArticleList({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        category: category as string,
        search: search as string,
        isPublic: true
      });

      return res.status(200).json({
        success: true,
        data: result.articles,
        pagination: result.pagination
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  static async getPublicArticleById(req: Request, res: Response) {
    try {
      const articleId = req.params.articleId as string;
      const article = await ArticleService.getArticleById(articleId, true);

      return res.status(200).json({
        success: true,
        data: article
      });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message || 'Article not found' });
    }
  }

  static async createArticle(req: Request, res: Response) {
    try {
      const parsed = CreateArticleSchema.parse({ body: req.body });
      const actorUserId = (req as any).user?.userId || (req as any).user?.id || '65f1a2b3c4d5e6f7a8b9c000';

      const article = await ArticleService.createArticle(parsed.body, actorUserId, req.ip);

      return res.status(201).json({
        success: true,
        message: article.status === 'Published' ? 'Article published successfully' : 'Article saved as draft',
        data: article
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Validation Error' });
    }
  }

  static async updateArticle(req: Request, res: Response) {
    try {
      const articleId = req.params.articleId as string;
      const parsed = UpdateArticleSchema.parse({ params: req.params, body: req.body });
      const actorUserId = (req as any).user?.userId || (req as any).user?.id || '65f1a2b3c4d5e6f7a8b9c000';

      const updated = await ArticleService.updateArticle(articleId, parsed.body, actorUserId, req.ip);

      return res.status(200).json({
        success: true,
        message: 'Article updated successfully',
        data: updated
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Bad Request' });
    }
  }

  static async deleteArticle(req: Request, res: Response) {
    try {
      const articleId = req.params.articleId as string;
      const actorUserId = (req as any).user?.userId || (req as any).user?.id || '65f1a2b3c4d5e6f7a8b9c000';

      const deletedId = await ArticleService.deleteArticle(articleId, actorUserId, req.ip);

      return res.status(200).json({
        success: true,
        message: 'Article deleted successfully',
        deletedArticleId: deletedId
      });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message || 'Article not found' });
    }
  }

  static async getContentStats(_req: Request, res: Response) {
    try {
      const stats = await ArticleService.getContentStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }
}
