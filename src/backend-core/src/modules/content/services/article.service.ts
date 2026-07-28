import mongoose from 'mongoose';
import { Article, IArticle, ArticleCategory, ArticleStatus, TargetAudience } from '../models/article.model';
import { ContentAuditLog } from '../models/audit-log.model';
import { CreateArticleInput, UpdateArticleInput } from '../schemas/article.schema';

export class ArticleService {
  static async createArticle(
    input: CreateArticleInput,
    actorUserId: string,
    ipAddress?: string
  ): Promise<IArticle> {
    const wordsCount = (input.bodyContent || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordsCount / 200));

    let publishedAt: Date | undefined;
    let status = input.status || 'Draft';

    if (status === 'Published') {
      publishedAt = new Date();
    } else if (input.scheduledAt) {
      status = 'Scheduled';
    }

    const article = new Article({
      title: input.title,
      bodyContent: input.bodyContent || '',
      category: input.category || 'News',
      status,
      coverImageUrl: input.coverImageUrl,
      publishedAt,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      targetAudience: input.targetAudience || ['Donors'],
      authorStaffId: new mongoose.Types.ObjectId(actorUserId),
      authorName: 'Dr. Sarah Chen',
      readTimeMinutes,
      viewsCount: 0,
      publicReachCount: 0,
      sharesCount: 0
    });

    await article.save();

    await ContentAuditLog.create({
      actorUserId: new mongoose.Types.ObjectId(actorUserId),
      action: 'CREATE_ARTICLE',
      resourceType: 'Article',
      resourceId: article._id,
      newValue: input,
      timestamp: new Date(),
      ipAddress: ipAddress || '127.0.0.1'
    });

    return article;
  }

  static async getArticleList(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    if (params?.category && params.category !== 'All') {
      query.category = params.category;
    }

    if (params?.status && params.status !== 'All') {
      query.status = params.status;
    }

    if (params?.search) {
      query.title = { $regex: params.search, $options: 'i' };
    }

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(query)
    ]);

    const summary = await this.getContentStats();

    return {
      articles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      },
      summary
    };
  }

  static async getArticleById(articleId: string, isPublicView = false): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      throw new Error('Article not found');
    }

    const article = await Article.findById(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    if (isPublicView) {
      article.viewsCount = (article.viewsCount || 0) + 1;
      article.publicReachCount = Math.max(article.viewsCount, (article.publicReachCount || 0) + 1);
      await article.save();
    }

    const articleObj = article.toObject();

    const performance = {
      viewsCount: article.viewsCount || 0,
      publicReachCount: article.publicReachCount || 0,
      sharesCount: article.sharesCount || 0,
      engagementNote: (article.viewsCount > 100)
        ? 'This article has 24% more engagement than monthly average'
        : 'Steady engagement across target channels'
    };

    return {
      ...articleObj,
      performance
    };
  }

  static async updateArticle(
    articleId: string,
    input: UpdateArticleInput,
    actorUserId: string,
    ipAddress?: string
  ): Promise<IArticle> {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      throw new Error('Article not found');
    }

    const article = await Article.findById(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    const previousValue = article.toObject();

    if (input.title !== undefined) article.title = input.title;
    if (input.bodyContent !== undefined) {
      article.bodyContent = input.bodyContent;
      const wordsCount = input.bodyContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
      article.readTimeMinutes = Math.max(1, Math.ceil(wordsCount / 200));
    }
    if (input.category !== undefined) article.category = input.category;
    if (input.status !== undefined) {
      article.status = input.status;
      if (input.status === 'Published' && !article.publishedAt) {
        article.publishedAt = new Date();
      }
    }
    if (input.coverImageUrl !== undefined) article.coverImageUrl = input.coverImageUrl || undefined;
    if (input.scheduledAt !== undefined) {
      article.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : undefined;
      if (article.scheduledAt && article.scheduledAt > new Date()) {
        article.status = 'Scheduled';
      }
    }
    if (input.targetAudience !== undefined) article.targetAudience = input.targetAudience;

    await article.save();

    await ContentAuditLog.create({
      actorUserId: new mongoose.Types.ObjectId(actorUserId),
      action: 'UPDATE_ARTICLE',
      resourceType: 'Article',
      resourceId: article._id,
      previousValue,
      newValue: input,
      timestamp: new Date(),
      ipAddress: ipAddress || '127.0.0.1'
    });

    return article;
  }

  static async deleteArticle(articleId: string, actorUserId: string, ipAddress?: string): Promise<string> {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      throw new Error('Article not found or already deleted');
    }

    const article = await Article.findById(articleId);
    if (!article) {
      throw new Error('Article not found or already deleted');
    }

    const previousValue = article.toObject();
    await Article.deleteOne({ _id: article._id });

    await ContentAuditLog.create({
      actorUserId: new mongoose.Types.ObjectId(actorUserId),
      action: 'DELETE_ARTICLE',
      resourceType: 'Article',
      resourceId: article._id,
      previousValue,
      timestamp: new Date(),
      ipAddress: ipAddress || '127.0.0.1'
    });

    return articleId;
  }

  static async getContentStats() {
    const articles = await Article.find({}).lean();
    const totalArticles = articles.length;

    const publicReach = articles.reduce((sum, a) => sum + (a.publicReachCount || 0), 0);
    const activeAlerts = articles.filter(a => a.category === 'Alert' && a.status === 'Published').length;

    return {
      totalArticles,
      publicReach,
      activeAlerts
    };
  }

  static async publishScheduledArticles() {
    const now = new Date();
    const scheduled = await Article.find({
      status: 'Scheduled',
      scheduledAt: { $lte: now }
    });

    for (const article of scheduled) {
      article.status = 'Published';
      article.publishedAt = now;
      await article.save();

      await ContentAuditLog.create({
        actorUserId: article.authorStaffId,
        action: 'PUBLISH_ARTICLE',
        resourceType: 'Article',
        resourceId: article._id,
        newValue: { status: 'Published', publishedAt: now },
        timestamp: now,
        ipAddress: '127.0.0.1'
      });
    }

    return scheduled.length;
  }
}
