import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import Campaign from '../src/modules/campaign-mgmt/models/campaign.model';
import { AuditLog } from '../src/shared/audit/audit-log.model';
import { env } from '../src/config/env.config';

jest.setTimeout(30000);

describe('Campaign Management - Integration Tests', () => {
  let token: string;
  let invalidRoleToken: string;

  beforeAll(async () => {
    // Connect to the test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // Generate test JWT tokens
    token = jwt.sign(
      { id: 'staff-999', role: 'Blood Center Staff' },
      env.JWT_SECRET
    );
    
    invalidRoleToken = jwt.sign(
      { id: 'donor-111', role: 'Donor' },
      env.JWT_SECRET
    );
  }, 30000);

  afterAll(async () => {
    // Clean up and disconnect
    await mongoose.connection.close();
  }, 30000);

  beforeEach(async () => {
    // Clear collections before each test
    await Campaign.deleteMany({});
    if (AuditLog.collection) {
      await AuditLog.collection.deleteMany({});
    }
  });

  describe('POST /api/v1/campaigns', () => {
    it('should successfully create a campaign and write an audit log', async () => {
      const payload = {
        bloodCenterId: 'bc-001',
        name: 'Annual Summer Blood Drive',
        venue: 'Youth Center',
        location: {
          type: 'Point',
          coordinates: [106.700424, 10.776889],
        },
        startDateTime: '2026-08-10T08:00:00Z',
        endDateTime: '2026-08-10T17:00:00Z',
        targetBloodGroups: ['A+', 'O+'],
        capacity: 150,
        status: 'Draft',
      };

      const response = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(payload.name);
      expect(response.body.registeredCount).toBe(0);

      // Verify campaign was saved to database
      const dbCampaign = await Campaign.findById(response.body._id);
      expect(dbCampaign).toBeTruthy();
      expect(dbCampaign?.capacity).toBe(150);

      // Verify audit log was recorded in database
      const dbAuditLog = await AuditLog.findOne({ action: 'CREATE_CAMPAIGN' });
      expect(dbAuditLog).toBeTruthy();
      expect(dbAuditLog?.actorId).toBe('staff-999');
      expect(dbAuditLog?.targetId).toBe(response.body._id);
    });

    it('should return 401 Unauthorized if token is missing', async () => {
      const payload = {
        bloodCenterId: 'bc-001',
        name: 'Test',
        venue: 'Venue',
        location: {
          type: 'Point',
          coordinates: [106.700424, 10.776889],
        },
        startDateTime: '2026-08-10T08:00:00Z',
        endDateTime: '2026-08-10T17:00:00Z',
        targetBloodGroups: ['A+'],
        capacity: 50,
      };

      const response = await request(app)
        .post('/api/v1/campaigns')
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 Forbidden if user role is not Blood Center Staff', async () => {
      const payload = {
        bloodCenterId: 'bc-001',
        name: 'Test',
        venue: 'Venue',
        location: {
          type: 'Point',
          coordinates: [106.700424, 10.776889],
        },
        startDateTime: '2026-08-10T08:00:00Z',
        endDateTime: '2026-08-10T17:00:00Z',
        targetBloodGroups: ['A+'],
        capacity: 50,
      };

      const response = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${invalidRoleToken}`)
        .send(payload);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('should return 400 Bad Request if validation fails', async () => {
      const payload = {
        bloodCenterId: 'bc-001',
        name: '', // Empty name triggers validation failure
        venue: 'Venue',
        location: {
          type: 'Point',
          coordinates: [106.700424, 10.776889],
        },
        startDateTime: '2026-08-10T08:00:00Z',
        endDateTime: '2026-08-10T17:00:00Z',
        targetBloodGroups: ['A+'],
        capacity: 50,
      };

      const response = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/campaigns', () => {
    it('should retrieve a list of all campaigns', async () => {
      // Seed two campaigns
      const c1 = new Campaign({
        bloodCenterId: 'bc-001',
        name: 'Campaign 1',
        venue: 'Venue 1',
        location: { type: 'Point', coordinates: [106.7, 10.77] },
        startDateTime: new Date('2026-08-01T08:00:00Z'),
        endDateTime: new Date('2026-08-01T17:00:00Z'),
        targetBloodGroups: ['O+'],
        capacity: 100,
        status: 'Active',
      });
      const c2 = new Campaign({
        bloodCenterId: 'bc-001',
        name: 'Campaign 2',
        venue: 'Venue 2',
        location: { type: 'Point', coordinates: [106.7, 10.77] },
        startDateTime: new Date('2026-08-02T08:00:00Z'),
        endDateTime: new Date('2026-08-02T17:00:00Z'),
        targetBloodGroups: ['O+'],
        capacity: 100,
        status: 'Active',
      });
      await c1.save();
      await c2.save();

      const response = await request(app).get('/api/v1/campaigns');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe('GET /api/v1/campaigns/:id', () => {
    it('should retrieve a single campaign by ID', async () => {
      const c = new Campaign({
        bloodCenterId: 'bc-001',
        name: 'Campaign 1',
        venue: 'Venue 1',
        location: { type: 'Point', coordinates: [106.7, 10.77] },
        startDateTime: new Date('2026-08-01T08:00:00Z'),
        endDateTime: new Date('2026-08-01T17:00:00Z'),
        targetBloodGroups: ['O+'],
        capacity: 100,
        status: 'Active',
      });
      await c.save();

      const response = await request(app).get(`/api/v1/campaigns/${c._id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Campaign 1');
    });

    it('should return 404 if campaign is not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/api/v1/campaigns/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/campaigns/:id', () => {
    it('should successfully update campaign properties and write audit log', async () => {
      const c = new Campaign({
        bloodCenterId: 'bc-001',
        name: 'Campaign 1',
        venue: 'Venue 1',
        location: { type: 'Point', coordinates: [106.7, 10.77] },
        startDateTime: new Date('2026-08-01T08:00:00Z'),
        endDateTime: new Date('2026-08-01T17:00:00Z'),
        targetBloodGroups: ['O+'],
        capacity: 100,
        status: 'Active',
      });
      await c.save();

      const payload = {
        capacity: 120,
        venue: 'New Venue 1',
      };

      const response = await request(app)
        .patch(`/api/v1/campaigns/${c._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.capacity).toBe(120);
      expect(response.body.venue).toBe('New Venue 1');

      // Verify db changes
      const dbCampaign = await Campaign.findById(c._id);
      expect(dbCampaign?.capacity).toBe(120);
      expect(dbCampaign?.venue).toBe('New Venue 1');

      // Verify audit log
      const dbAuditLog = await AuditLog.findOne({ action: 'UPDATE_CAMPAIGN' });
      expect(dbAuditLog).toBeTruthy();
      expect(dbAuditLog?.actorId).toBe('staff-999');
      expect(dbAuditLog?.targetId).toBe(c._id.toString());
    });

    it('should reject updates to server-managed fields like registeredCount', async () => {
      const c = new Campaign({
        bloodCenterId: 'bc-001',
        name: 'Campaign 1',
        venue: 'Venue 1',
        location: { type: 'Point', coordinates: [106.7, 10.77] },
        startDateTime: new Date('2026-08-01T08:00:00Z'),
        endDateTime: new Date('2026-08-01T17:00:00Z'),
        targetBloodGroups: ['O+'],
        capacity: 100,
        status: 'Active',
      });
      await c.save();

      const response = await request(app)
        .patch(`/api/v1/campaigns/${c._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ registeredCount: 50 });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('BUSINESS_RULE_VIOLATION');
    });

    it('should reject capacity reduction below registeredCount', async () => {
      const c = new Campaign({
        bloodCenterId: 'bc-001',
        name: 'Campaign 1',
        venue: 'Venue 1',
        location: { type: 'Point', coordinates: [106.7, 10.77] },
        startDateTime: new Date('2026-08-01T08:00:00Z'),
        endDateTime: new Date('2026-08-01T17:00:00Z'),
        targetBloodGroups: ['O+'],
        capacity: 100,
        registeredCount: 50,
        status: 'Active',
      });
      await c.save();

      const response = await request(app)
        .patch(`/api/v1/campaigns/${c._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ capacity: 40 });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(response.body.message).toContain('Capacity cannot be reduced');
    });
  });
});
