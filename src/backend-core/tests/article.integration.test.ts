import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import Article from '../src/modules/content-news/models/article.model';
import { AuditLog } from '../src/shared/audit/audit-log.model';
import { env } from '../src/config/env.config';

jest.setTimeout(30000);

describe('Article Management - Integration Tests', () => {
  let token: string;
  let invalidRoleToken: string;
  const validStaffId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    token = jwt.sign(
      { id: validStaffId, role: 'Blood Center Staff' },
      env.JWT_SECRET
    );

    invalidRoleToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: 'Donor' },
      env.JWT_SECRET
    );
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 30000);

  beforeEach(async () => {
    await Article.deleteMany({});
    if (AuditLog.collection) {
      await AuditLog.collection.deleteMany({});
    }
  });

  describe('POST /api/v1/articles', () => {
    it('should create a published article and record audit log', async () => {
      const payload = {
        authorStaffId: validStaffId,
        title: 'Emergency Blood Drive Announcement',
        bodyContent: 'Urgent need for O- negative blood donations at main branch.',
        category: 'Alert',
        status: 'Published',
        targetAudience: ['Donors', 'Hospitals'],
        featuredMediaUrl: 'https://cdn.lifeline.org/banner.png',
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(payload.title);
      expect(response.body.status).toBe('Published');

      // Verify DB persistence
      const dbArticle = await Article.findById(response.body._id);
      expect(dbArticle).toBeTruthy();
      expect(dbArticle?.category).toBe('Alert');

      // Verify Audit log
      const dbAuditLog = await AuditLog.findOne({ action: 'CREATE_ARTICLE' });
      expect(dbAuditLog).toBeTruthy();
      expect(dbAuditLog?.actorId).toBe(validStaffId);
    });

    it('should return 400 Bad Request if publishing without target audience', async () => {
      const payload = {
        authorStaffId: validStaffId,
        title: 'Invalid Article',
        bodyContent: 'Content without audience',
        category: 'News',
        status: 'Published',
        targetAudience: [],
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 Unauthorized if token is missing', async () => {
      const payload = {
        authorStaffId: validStaffId,
        title: 'Unauthorized Article',
        bodyContent: 'Content',
        category: 'News',
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/articles', () => {
    it('should return paginated articles list', async () => {
      for (let i = 1; i <= 15; i++) {
        await Article.create({
          authorStaffId: validStaffId,
          title: `Article ${i}`,
          bodyContent: `Body ${i}`,
          category: 'News',
          status: 'Published',
          targetAudience: ['Donors'],
        });
      }

      const response = await request(app)
        .get('/api/v1/articles?page=1&limit=12');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(12);
      expect(response.body.total).toBe(15);
      expect(response.body.totalPages).toBe(2);
    });
  });

  describe('GET /api/v1/articles/stats', () => {
    it('should return dashboard summary stats', async () => {
      await Article.create([
        {
          authorStaffId: validStaffId,
          title: 'Alert 1',
          bodyContent: 'Body',
          category: 'Alert',
          status: 'Published',
          targetAudience: ['Donors'],
          reachCount: 100,
        },
        {
          authorStaffId: validStaffId,
          title: 'News 1',
          bodyContent: 'Body',
          category: 'News',
          status: 'Draft',
          reachCount: 50,
        },
      ]);

      const response = await request(app).get('/api/v1/articles/stats');

      expect(response.status).toBe(200);
      expect(response.body.totalArticles).toBe(2);
      expect(response.body.publicReach).toBe(150);
      expect(response.body.activeAlerts).toBe(1);
    });
  });

  describe('GET /api/v1/articles/:id', () => {
    it('should return a single article by ID', async () => {
      const art = await Article.create({
        authorStaffId: validStaffId,
        title: 'Single Article',
        bodyContent: 'Content',
        category: 'Educational',
        status: 'Draft',
      });

      const response = await request(app).get(`/api/v1/articles/${art._id}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Single Article');
    });

    it('should return 404 for non-existent article', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/api/v1/articles/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/articles/:id', () => {
    it('should update article, toggle status, and record UNPUBLISH_ARTICLE audit log', async () => {
      const art = await Article.create({
        authorStaffId: validStaffId,
        title: 'Live Article',
        bodyContent: 'Body',
        category: 'Alert',
        status: 'Published',
        targetAudience: ['Donors'],
      });

      const response = await request(app)
        .patch(`/api/v1/articles/${art._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Draft' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Draft');

      const dbAuditLog = await AuditLog.findOne({ action: 'UNPUBLISH_ARTICLE' });
      expect(dbAuditLog).toBeTruthy();
    });
  });

  describe('DELETE /api/v1/articles/:id', () => {
    it('should soft delete article and record DELETE_ARTICLE audit log', async () => {
      const art = await Article.create({
        authorStaffId: validStaffId,
        title: 'To Be Deleted',
        bodyContent: 'Body',
        category: 'News',
        status: 'Draft',
      });

      const response = await request(app)
        .delete(`/api/v1/articles/${art._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Article deleted successfully');

      const dbArticle = await Article.findById(art._id);
      expect(dbArticle?.deletedAt).toBeTruthy();

      const dbAuditLog = await AuditLog.findOne({ action: 'DELETE_ARTICLE' });
      expect(dbAuditLog).toBeTruthy();
    });
  });

  describe('POST /api/v1/articles/upload-media', () => {
    it('should return 401 Unauthorized if token is missing', async () => {
      const response = await request(app)
        .post('/api/v1/articles/upload-media')
        .attach('file', Buffer.from('fake image'), 'test.png');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 Forbidden if user is not Blood Center Staff', async () => {
      const response = await request(app)
        .post('/api/v1/articles/upload-media')
        .set('Authorization', `Bearer ${invalidRoleToken}`)
        .attach('file', Buffer.from('fake image'), 'test.png');

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('should return 400 Bad Request if invalid file type is uploaded', async () => {
      const response = await request(app)
        .post('/api/v1/articles/upload-media')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('plain text file content'), { filename: 'test.txt', contentType: 'text/plain' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.message).toContain('Only PNG and JPG/JPEG images are allowed');
    });

    it('should return 400 Bad Request if no file is attached', async () => {
      const response = await request(app)
        .post('/api/v1/articles/upload-media')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
