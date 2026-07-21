import articleController from './article.controller';
import articleService from './article.service';
import { createArticleSchema, updateArticleSchema, articleQuerySchema } from './schemas/article.schema';
import Article from './models/article.model';
import articleRepository from './article.repository';
import { AuditLogger } from '../../shared/audit/audit-logger';
import { validate } from '../../shared/validate.middleware';
import { errorMiddleware } from '../../shared/error.middleware';

jest.mock('./article.repository');
jest.mock('../../shared/audit/audit-logger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockedRepository = articleRepository as jest.Mocked<typeof articleRepository>;
const mockedAuditLogger = AuditLogger as jest.Mocked<typeof AuditLogger>;

describe('Article Module - Unit & Integration Tests', () => {
  describe('Validation Schemas', () => {
    it('should validate create article schema with valid draft data', () => {
      const validDraft = {
        title: 'Emergency Blood Drive',
        bodyContent: 'Content for emergency blood drive',
        category: 'Alert',
        status: 'Draft',
      };

      expect(() => createArticleSchema.parse({ body: validDraft })).not.toThrow();
    });

    it('should validate create article schema with valid published data and target audience', () => {
      const validPublished = {
        title: 'Emergency Blood Drive',
        bodyContent: 'Content for emergency blood drive',
        category: 'Alert',
        status: 'Published',
        targetAudience: ['Donors', 'Hospitals'],
      };

      expect(() => createArticleSchema.parse({ body: validPublished })).not.toThrow();
    });

    it('should reject published article without target audience', () => {
      const invalidPublished = {
        title: 'Emergency Blood Drive',
        bodyContent: 'Content for emergency blood drive',
        category: 'Alert',
        status: 'Published',
        targetAudience: [],
      };

      expect(() => createArticleSchema.parse({ body: invalidPublished })).toThrow();
    });

    it('should reject create article schema without title', () => {
      const invalidData = {
        title: '',
        bodyContent: 'Content',
        category: 'News',
      };

      expect(() => createArticleSchema.parse({ body: invalidData })).toThrow();
    });

    it('should parse query parameters with default pagination limit 12', () => {
      const parsed = articleQuerySchema.parse({ query: { page: '2', limit: '12', category: 'News' } });
      expect(parsed.query).toEqual({
        page: 2,
        limit: 12,
        category: 'News',
      });
    });
  });

  describe('Business Rules (ArticleService)', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw error when publishing without target audience', async () => {
      const input: any = {
        title: 'Test Article',
        bodyContent: 'Test Content',
        category: 'News',
        status: 'Published',
        targetAudience: [],
      };

      await expect(articleService.createArticle(input)).rejects.toThrow(
        'At least one target audience must be selected before publishing.'
      );
    });

    it('should successfully create a draft article', async () => {
      const input: any = {
        title: 'Draft Article',
        bodyContent: 'Body content',
        category: 'Educational',
        status: 'Draft',
      };

      const mockCreated = { ...input, _id: 'article-123', viewCount: 0, reachCount: 0 };
      mockedRepository.create.mockResolvedValue(mockCreated as any);

      const result = await articleService.createArticle(input, 'staff-001');

      expect(result).toBeDefined();
      expect(mockedRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Draft Article',
          status: 'Draft',
        })
      );
    });

    it('should return articles with pagination', async () => {
      const mockResult = {
        articles: [{ _id: 'art-1', title: 'Art 1' }],
        total: 15,
        totalPages: 2,
        page: 1,
        limit: 12,
      };

      mockedRepository.findAll.mockResolvedValue(mockResult as any);

      const res = await articleService.getAllArticles({ page: 1, limit: 12 });

      expect(res.articles).toHaveLength(1);
      expect(res.totalPages).toBe(2);
      expect(mockedRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 12 });
    });

    it('should calculate article stats correctly', async () => {
      const mockStats = {
        totalArticles: 24,
        publicReach: 4200,
        activeAlerts: 3,
      };

      mockedRepository.getStats.mockResolvedValue(mockStats);

      const stats = await articleService.getArticleStats();

      expect(stats.totalArticles).toBe(24);
      expect(stats.publicReach).toBe(4200);
      expect(stats.activeAlerts).toBe(3);
    });

    it('should soft-delete an article', async () => {
      const mockArticle = { _id: 'art-100', title: 'Article 100', status: 'Published' };
      mockedRepository.findById.mockResolvedValue(mockArticle as any);
      mockedRepository.softDelete.mockResolvedValue({ ...mockArticle, deletedAt: new Date() } as any);

      const result = await articleService.deleteArticle('art-100');

      expect(result).toBeDefined();
      expect(mockedRepository.softDelete).toHaveBeenCalledWith('art-100');
    });
  });

  describe('ArticleController', () => {
    let mockRequest: any;
    let mockResponse: any;
    let nextFunction: any;

    beforeEach(() => {
      mockRequest = {};
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn((err?: any) => {
        if (err) {
          errorMiddleware(err, mockRequest, mockResponse, jest.fn());
        }
      });
      mockedAuditLogger.log.mockClear();
    });

    describe('createArticle', () => {
      it('should return 400 on Zod validation error', async () => {
        mockRequest.body = { title: '' }; // Invalid title

        const validateMiddleware = validate(createArticleSchema);
        await validateMiddleware(mockRequest, mockResponse, (err?: any) => {
          if (err) {
            errorMiddleware(err, mockRequest, mockResponse, jest.fn());
          }
        });

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'VALIDATION_ERROR',
          })
        );
      });

      it('should create article and log audit trail', async () => {
        const articleData = {
          title: 'News Title',
          bodyContent: 'News Content',
          category: 'News',
          status: 'Published',
          targetAudience: ['Donors'],
        };
        mockRequest.body = articleData;
        mockRequest.user = { id: 'staff-777', role: 'Blood Center Staff' };

        const createdArticle = { ...articleData, _id: 'art-999' };
        jest.spyOn(articleService, 'createArticle').mockResolvedValue(createdArticle as any);

        await articleController.createArticle(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(createdArticle);
        expect(mockedAuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            actorId: 'staff-777',
            action: 'CREATE_ARTICLE',
            targetId: 'art-999',
            targetType: 'Article',
          })
        );
      });
    });

    describe('updateArticle', () => {
      it('should reject updates to server-managed properties', async () => {
        mockRequest.params = { id: 'art-123' };
        mockRequest.body = { deletedAt: new Date() };

        await articleController.updateArticle(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'BUSINESS_RULE_VIOLATION',
            message: 'Updates to server-managed property deletedAt are not allowed',
          })
        );
      });

      it('should return 404 when updating non-existent article', async () => {
        mockRequest.params = { id: 'art-nonexistent' };
        mockRequest.body = { title: 'Updated' };

        jest.spyOn(articleService, 'getArticleById').mockResolvedValue(null);

        await articleController.updateArticle(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'NOT_FOUND',
          })
        );
      });

      it('should unpublish article and emit UNPUBLISH_ARTICLE audit log when toggling Published to Draft', async () => {
        mockRequest.params = { id: 'art-123' };
        mockRequest.body = { status: 'Draft' };
        mockRequest.user = { id: 'staff-777', role: 'Blood Center Staff' };

        const existingArticle = { _id: 'art-123', status: 'Published', title: 'Live News' };
        const updatedArticle = { _id: 'art-123', status: 'Draft', title: 'Live News' };

        jest.spyOn(articleService, 'getArticleById').mockResolvedValue(existingArticle as any);
        jest.spyOn(articleService, 'updateArticle').mockResolvedValue(updatedArticle as any);

        await articleController.updateArticle(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockedAuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            actorId: 'staff-777',
            action: 'UNPUBLISH_ARTICLE',
            targetId: 'art-123',
            targetType: 'Article',
          })
        );
      });
    });

    describe('deleteArticle', () => {
      it('should soft-delete article and log DELETE_ARTICLE audit event', async () => {
        mockRequest.params = { id: 'art-555' };
        mockRequest.user = { id: 'staff-777', role: 'Blood Center Staff' };

        const existingArticle = { _id: 'art-555', title: 'Obsolete Article', category: 'News' };
        jest.spyOn(articleService, 'getArticleById').mockResolvedValue(existingArticle as any);
        jest.spyOn(articleService, 'deleteArticle').mockResolvedValue({ ...existingArticle, deletedAt: new Date() } as any);

        await articleController.deleteArticle(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Article deleted successfully',
          id: 'art-555',
        });
        expect(mockedAuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            actorId: 'staff-777',
            action: 'DELETE_ARTICLE',
            targetId: 'art-555',
            targetType: 'Article',
          })
        );
      });
    });

    describe('uploadMedia', () => {
      it('should return 400 if no file is provided', async () => {
        mockRequest.file = undefined;

        await articleController.uploadMedia(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: 'No image file provided',
          })
        );
      });

      it('should return 201 with Cloudinary secure URL on valid file upload', async () => {
        mockRequest.file = {
          buffer: Buffer.from('fake image data'),
          mimetype: 'image/png',
        };

        const mockUrl = 'https://res.cloudinary.com/lifeline/image/upload/v1/banner.png';
        jest.spyOn(articleService, 'uploadArticleMedia').mockResolvedValue({ url: mockUrl });

        await articleController.uploadMedia(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({ url: mockUrl });
      });
    });
  });
});
