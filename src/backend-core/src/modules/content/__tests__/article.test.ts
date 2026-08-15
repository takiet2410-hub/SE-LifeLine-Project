import { ArticleService } from '../services/article.service';
import { Article } from '../models/article.model';
import { AdminAuditLog } from '../../admin/models/audit-log.model';
import { ContentAuditLog } from '../models/audit-log.model';

jest.mock('../models/article.model');
jest.mock('../../admin/models/audit-log.model');
jest.mock('../models/audit-log.model');
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
  });
});
