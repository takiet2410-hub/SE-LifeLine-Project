import { ArticleService } from '../services/article.service';
import { Article } from '../models/article.model';
import { AdminAuditLog } from '../../admin/models/audit-log.model';
import { ContentAuditLog } from '../models/audit-log.model';
import { isFeatureEnabled } from '../../admin/services/admin-toggle.service';
import { SystemConfig } from '../../admin/models/system-config.model';
import { CreateArticleSchema } from '../schemas/article.schema';

jest.mock('../models/article.model');
jest.mock('../../admin/models/audit-log.model');
jest.mock('../models/audit-log.model');
jest.mock('../../admin/services/admin-toggle.service', () => ({
  isFeatureEnabled: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../admin/models/system-config.model', () => ({
  SystemConfig: { findOne: jest.fn() },
}));
jest.mock('../../notification/services/notification.service');
jest.mock('../../auth-account/models/user.model', () => ({
  User: {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: '507f1f77bcf86cd799439011', email: 'donor1@lifeline.vn' },
        ]),
      }),
    }),
  },
}));

describe('Content & News Feed Module Unit Tests', () => {
  beforeEach(() => {
    (isFeatureEnabled as jest.Mock).mockResolvedValue(true);
    (SystemConfig.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue({ value: true }) });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createArticle', () => {
    it('should create article and log audit record to audit_logs collection', async () => {
      const mockArticle = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Hướng dẫn hiến máu an toàn năm 2026',
        slug: 'huong-dan-hien-mau-an-toan-nam-2026',
        category: 'Educational',
        status: 'Published',
        targetAudience: ['Donors'],
        publishedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      (Article as unknown as jest.Mock).mockImplementation(() => mockArticle);
      (Article.findOne as jest.Mock).mockResolvedValue(null);
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439013' });

      const input = {
        title: 'Hướng dẫn hiến máu an toàn năm 2026',
        summary: 'Tóm tắt quy trình hiến máu',
        bodyContent: 'Nội dung chi tiết bài viết...',
        category: 'Educational' as const,
        status: 'Published' as const,
        targetAudience: ['Donors'] as any,
      };

      const result = await ArticleService.createArticle(input, '507f1f77bcf86cd799439011');

      expect(mockArticle.save).toHaveBeenCalled();
      expect(AdminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionCategory: 'Content Management',
          action: 'Create Article',
          actorUserId: '507f1f77bcf86cd799439011',
          status: 'Success',
        })
      );
    });
  });

  describe('publishScheduledArticles', () => {
    it('should publish due scheduled articles and record audit log to audit_logs', async () => {
      const mockScheduledArticle = {
        _id: '507f1f77bcf86cd799439012',
        authorStaffId: '507f1f77bcf86cd799439011',
        title: 'Chiến dịch Giọt Hồng Mùa Hè',
        status: 'Scheduled',
        publishAt: new Date(Date.now() - 1000),
        save: jest.fn().mockResolvedValue(true),
      };

      (Article.find as jest.Mock).mockResolvedValue([mockScheduledArticle]);
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439013' });
      (ContentAuditLog.create as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439014' });

      const publishedCount = await ArticleService.publishScheduledArticles();

      expect(publishedCount).toBe(1);
      expect(mockScheduledArticle.status).toBe('Published');
      expect(mockScheduledArticle.save).toHaveBeenCalled();
    });

    it('should not publish scheduled articles while the news feature is disabled', async () => {
      (isFeatureEnabled as jest.Mock).mockResolvedValue(false);

      const publishedCount = await ArticleService.publishScheduledArticles();

      expect(publishedCount).toBe(0);
      expect(Article.find).not.toHaveBeenCalled();
    });

    it('should respect the autoPublishArticles system configuration', async () => {
      (SystemConfig.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue({ value: false }) });

      const publishedCount = await ArticleService.publishScheduledArticles();

      expect(publishedCount).toBe(0);
      expect(Article.find).not.toHaveBeenCalled();
    });

    it('removes executable HTML before persisting article content', async () => {
      let persistedInput: any;
      const mockArticle = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Safe article',
        status: 'Draft',
        category: 'News',
        save: jest.fn().mockResolvedValue(true),
      };
      (Article as unknown as jest.Mock).mockImplementation((input) => {
        persistedInput = input;
        return mockArticle;
      });
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({});

      await ArticleService.createArticle({
        title: 'Safe article',
        bodyContent: '<p>Thông tin</p><script>alert(1)</script><img src="x" onerror="alert(2)">',
        category: 'News',
        status: 'Draft',
        targetAudience: ['Donors'],
      }, '507f1f77bcf86cd799439011');

      expect(persistedInput.bodyContent).toContain('<p>Thông tin</p>');
      expect(persistedInput.bodyContent).not.toContain('<script>');
      expect(persistedInput.bodyContent).not.toContain('onerror');
    });

    it('requires a future publishing date for Scheduled articles', () => {
      const parsed = CreateArticleSchema.safeParse({
        body: { title: 'Scheduled article', status: 'Scheduled', bodyContent: 'Nội dung' },
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('public article views', () => {
    it('increments analytics without changing the editorial updatedAt timestamp', async () => {
      const article = {
        toObject: () => ({
          _id: '507f1f77bcf86cd799439012',
          title: 'Public article',
          bodyContent: '<p>Content</p>',
          performance: {},
        }),
        authorStaffId: { fullName: 'Editor' },
      };
      const populate = jest.fn().mockResolvedValue(article);
      (Article.findOneAndUpdate as jest.Mock).mockReturnValue({ populate });

      await ArticleService.getArticleById('507f1f77bcf86cd799439012', true);

      expect(Article.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ _id: '507f1f77bcf86cd799439012', status: 'Published' }),
        { $inc: { viewsCount: 1, 'performance.reach': 1 } },
        expect.objectContaining({ returnDocument: 'after', timestamps: false })
      );
    });
  });
});
