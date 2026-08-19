import mongoose from 'mongoose';
import { Article, IArticle, ArticleStatus } from '../models/article.model';
import { env } from '../../../config/env.config';
import { ContentAuditLog } from '../models/audit-log.model';
import { AdminAuditLog } from '../../admin/models/audit-log.model';
import { CreateArticleInput, UpdateArticleInput } from '../schemas/article.schema';
import { NotificationService } from '../../notification/services/notification.service';
import { User } from '../../auth-account/models/user.model';
import { isFeatureEnabled } from '../../admin/services/admin-toggle.service';
import { SystemConfig } from '../../admin/models/system-config.model';
import sanitizeHtml from 'sanitize-html';

export class ArticleService {
  private static sanitizeArticleHtml(value: string): string {
    return sanitizeHtml(value || '', {
      allowedTags: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
        'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'a', 'img', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span'
      ],
      allowedAttributes: {
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        '*': ['class']
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      allowedSchemesByTag: { img: ['http', 'https', 'data'] },
      transformTags: {
        a: (_tagName, attribs) => ({
          tagName: 'a',
          attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' }
        })
      },
      disallowedTagsMode: 'discard'
    });
  }

  private static async writeContentAudit(entry: Record<string, unknown>): Promise<void> {
    try {
      await ContentAuditLog.create(entry);
    } catch (error) {
      console.error('[ArticleService] Content audit write failed after content mutation:', error);
    }
  }

  private static async broadcastArticleNotification(article: any) {
    try {
      if (!(await isFeatureEnabled('news_content_portal'))) return;

      const { title, category, targetAudience } = article;
      
      const rolesToQuery: Array<'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator'> = [];
      if (!targetAudience || targetAudience.length === 0) {
        rolesToQuery.push('Donor', 'BloodCenterStaff', 'HospitalStaff');
      } else {
        if (targetAudience.includes('Donors')) rolesToQuery.push('Donor');
        if (targetAudience.includes('Staff') || targetAudience.includes('BloodCenterStaff')) rolesToQuery.push('BloodCenterStaff');
        if (targetAudience.includes('Hospitals') || targetAudience.includes('HospitalStaff')) rolesToQuery.push('HospitalStaff');
      }
      
      if (rolesToQuery.length === 0) rolesToQuery.push('Donor');

      const users = await User.find({
        accountStatus: 'Active',
        $or: [{ roles: { $in: rolesToQuery } }, { role: { $in: rolesToQuery } }]
      }).select('_id email').lean();
      if (users.length === 0) return;

      const recipientIds = users.map(u => u._id.toString());
      
      let notifType: 'Campaign' | 'Routine' = 'Routine';
      if (category === 'Campaign') notifType = 'Campaign';

      await NotificationService.sendNotification({
        recipientIds,
        type: notifType,
        title: `Bài viết mới: ${title}`,
        body: `Một thông tin mới thuộc chuyên mục ${category} vừa được xuất bản trên hệ thống.`,
        payload: {
          articleId: article._id.toString(),
          deepLink: `${env.FRONTEND_URL}/news/${article._id.toString()}`,
          sourceRefId: article._id.toString(),
          sourceRefType: 'Article'
        },
        channels: ['InApp', 'WebPush', 'Email']
      });
      console.log(`[ArticleService] Broadcasted notification to ${recipientIds.length} users for article ${article._id}`);
    } catch (error) {
      console.error('[ArticleService] Error broadcasting article notification:', error);
    }
  }

  static async createArticle(
    input: CreateArticleInput,
    actorUserId: string,
    ipAddress?: string
  ): Promise<IArticle> {
    const safeBodyContent = this.sanitizeArticleHtml(input.bodyContent || '');
    const wordsCount = safeBodyContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
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
      bodyContent: safeBodyContent,
      status,
      category: input.category || 'News',
      targetAudience: input.targetAudience || ['Donors'],
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      readTimeMinutes,
      imageUrls: input.coverImageUrl ? [input.coverImageUrl] : [],
      publishedAt,
      authorStaffId: new mongoose.Types.ObjectId(actorUserId)
    });

    await article.save();

    await this.writeContentAudit({
      actorUserId: new mongoose.Types.ObjectId(actorUserId),
      action: 'CREATE_ARTICLE',
      resourceType: 'Article',
      resourceId: article._id,
      newValue: input,
      timestamp: new Date(),
      ipAddress: ipAddress || '127.0.0.1'
    });

    try {
      await AdminAuditLog.create({
        actorUserId,
        actorName: 'Content Staff',
        action: 'Create Article',
        actionCategory: 'Content Management',
        resourceType: 'Article',
        resourceId: article._id.toString(),
        newValue: { title: input.title, status: article.status, category: article.category },
        details: `Created article "${input.title}" (${article.status})`,
        ipAddress: ipAddress || '127.0.0.1',
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[ArticleService] AdminAuditLog warning:', auditErr);
    }

    if (status === 'Published') {
      this.broadcastArticleNotification(article);
    }

    return article;
  }

  static async getArticleList(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
    isPublic?: boolean;
  }) {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, Math.min(100, params?.limit || 10));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params?.isPublic) {
      query.status = 'Published';
    } else if (params?.status && params.status !== 'All') {
      query.status = params.status;
    }
    
    if (params?.category && params.category !== 'All') {
      query.category = params.category;
    }

    if (params?.search) {
      const escapedSearch = params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: escapedSearch, $options: 'i' };
    }

    const [articles, total] = await Promise.all([
      Article.find(query)
        .populate('authorStaffId', 'fullName role')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(query)
    ]);

    const summary = await this.getContentStats();

    const mappedArticles = articles.map((article: any) => ({
      ...article,
      bodyContent: this.sanitizeArticleHtml(article.bodyContent || ''),
      authorName: (article.authorStaffId as any)?.fullName || 'Blood Center Staff',
      coverImageUrl: article.imageUrls?.[0] || '',
      performance: {
        viewsCount: article.viewsCount || 0,
        publicReachCount: article.performance?.reach || 0,
        sharesCount: article.performance?.shares || 0,
        engagementNote: ''
      }
    }));

    return {
      articles: mappedArticles,
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

    const query: any = { _id: articleId };
    if (isPublicView) {
      query.status = 'Published';
    }

    let article;
    if (isPublicView) {
      article = await Article.findOneAndUpdate(
        query,
        { $inc: { viewsCount: 1, 'performance.reach': 1 } },
        // A view is analytics, not an editorial update. Keep updatedAt reserved
        // for actual content changes so the public UI remains trustworthy.
        { returnDocument: 'after', timestamps: false }
      ).populate('authorStaffId', 'fullName role');
    } else {
      article = await Article.findOne(query).populate('authorStaffId', 'fullName role');
    }
    if (!article) {
      throw new Error('Article not found');
    }

    const articleObj = article.toObject();
    
    // Map for frontend which expects coverImageUrl, authorName and performance
    return {
      ...articleObj,
      bodyContent: this.sanitizeArticleHtml(articleObj.bodyContent || ''),
      authorName: (articleObj.authorStaffId as any)?.fullName || 'Blood Center Staff',
      coverImageUrl: articleObj.imageUrls?.[0] || '',
      performance: {
        viewsCount: articleObj.viewsCount || 0,
        publicReachCount: articleObj.performance?.reach || 0,
        sharesCount: articleObj.performance?.shares || 0,
        engagementNote: ''
      }
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
      article.bodyContent = this.sanitizeArticleHtml(input.bodyContent);
      const wordsCount = article.bodyContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
      article.readTimeMinutes = Math.max(1, Math.ceil(wordsCount / 200));
    }
    if (input.category !== undefined) article.category = input.category as any;
    if (input.targetAudience !== undefined) article.targetAudience = input.targetAudience;
    if (input.coverImageUrl !== undefined) {
      article.imageUrls = input.coverImageUrl ? [input.coverImageUrl] : [];
    }
    if (input.scheduledAt !== undefined) {
      article.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
      if (input.scheduledAt && input.status === undefined) article.status = 'Scheduled';
    }
    if (input.status !== undefined) {
      article.status = input.status;
      if (input.status === 'Published' && !article.publishedAt) {
        article.publishedAt = new Date();
      }
    }

    await article.save();

    // Trigger broadcast if status changed to Published
    if (previousValue.status !== 'Published' && article.status === 'Published') {
      this.broadcastArticleNotification(article);
    }

    await this.writeContentAudit({
      actorUserId: new mongoose.Types.ObjectId(actorUserId),
      action: 'UPDATE_ARTICLE',
      resourceType: 'Article',
      resourceId: article._id,
      previousValue,
      newValue: input,
      timestamp: new Date(),
      ipAddress: ipAddress || '127.0.0.1'
    });

    try {
      await AdminAuditLog.create({
        actorUserId,
        actorName: 'Content Staff',
        action: 'Update Article',
        actionCategory: 'Content Management',
        resourceType: 'Article',
        resourceId: article._id.toString(),
        previousValue: { title: previousValue.title, status: previousValue.status },
        newValue: { title: article.title, status: article.status },
        details: `Updated article "${article.title}"`,
        ipAddress: ipAddress || '127.0.0.1',
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[ArticleService] AdminAuditLog warning:', auditErr);
    }

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

    await this.writeContentAudit({
      actorUserId: new mongoose.Types.ObjectId(actorUserId),
      action: 'DELETE_ARTICLE',
      resourceType: 'Article',
      resourceId: article._id,
      previousValue,
      timestamp: new Date(),
      ipAddress: ipAddress || '127.0.0.1'
    });

    try {
      await AdminAuditLog.create({
        actorUserId,
        actorName: 'Content Staff',
        action: 'Delete Article',
        actionCategory: 'Content Management',
        resourceType: 'Article',
        resourceId: article._id.toString(),
        previousValue: { title: article.title, status: article.status },
        details: `Deleted article "${article.title}"`,
        ipAddress: ipAddress || '127.0.0.1',
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[ArticleService] AdminAuditLog warning:', auditErr);
    }

    return articleId;
  }

  static async getContentStats() {
    const articles = await Article.find({}).lean();
    const totalArticles = articles.length;
    const published = articles.filter(a => a.status === 'Published').length;

    return {
      totalArticles,
      publishedArticles: published
    };
  }

  static async publishScheduledArticles() {
    if (!(await isFeatureEnabled('news_content_portal'))) return 0;
    const autoPublish = await SystemConfig.findOne({ key: 'autoPublishArticles' }).lean();
    if (autoPublish && autoPublish.value === false) return 0;

    const now = new Date();
    const scheduled = await Article.find({
      status: 'Scheduled',
      scheduledAt: { $lte: now }
    });

    for (const article of scheduled) {
      article.status = 'Published';
      article.publishedAt = now;
      await article.save();

      await this.writeContentAudit({
        actorUserId: article.authorStaffId,
        action: 'PUBLISH_ARTICLE',
        resourceType: 'Article',
        resourceId: article._id,
        newValue: { status: 'Published', publishedAt: now },
        timestamp: now,
        ipAddress: '127.0.0.1'
      });

      try {
        await AdminAuditLog.create({
          actorUserId: article.authorStaffId?.toString(),
          actorName: 'System Scheduler',
          action: 'Publish Scheduled Article',
          actionCategory: 'Content Management',
          resourceType: 'Article',
          resourceId: article._id.toString(),
          newValue: { status: 'Published', publishedAt: now },
          details: `Automatically published scheduled article "${article.title}"`,
          ipAddress: '127.0.0.1',
          status: 'Success'
        });
      } catch (auditErr) {
        console.warn('[ArticleService] AdminAuditLog warning:', auditErr);
      }

      this.broadcastArticleNotification(article);
    }

    return scheduled.length;
  }
}
