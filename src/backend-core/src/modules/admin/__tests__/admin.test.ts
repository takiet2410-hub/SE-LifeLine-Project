import { AdminUserService, validateAndNormalizeRoles } from '../services/admin-user.service';
import { AdminRoleService } from '../services/admin-role.service';
import { AdminConfigService } from '../services/admin-config.service';
import { AdminToggleService } from '../services/admin-toggle.service';
import { AdminMonitoringService } from '../services/admin-monitoring.service';
import { User } from '../../auth-account/models/user.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { BloodCenter } from '../../auth-account/models/blood-center.model';
import { Hospital } from '../../auth-account/models/hospital.model';
import { Role } from '../models/role.model';
import { SystemConfig } from '../models/system-config.model';
import { FeatureToggle } from '../models/feature-toggle.model';
import { AdminAuditLog } from '../models/audit-log.model';
import { Campaign } from '../../campaign/models/campaign.model';
import { authorizePermissions } from '../../../shared/auth.middleware';
import { requireFeatureEnabled } from '../feature-toggle.middleware';
import { AdminCreateUserSchema, AdminPurgeUserDataSchema, AdminUpdateConfigSchema, AdminUpdateUserSchema } from '../schemas/admin.schema';
import mongoose from 'mongoose';
import { Badge } from '../../auth-account/models/badge.model';
import { Notification } from '../../notification/models/Notification';
import { NotificationPreference } from '../../notification/models/NotificationPreference';
import { UserDevice } from '../../notification/models/UserDevice';
import { ChatConversation } from '../../chatbot/models/chat-conversation.model';
import { ChatMessage } from '../../chatbot/models/chat-message.model';
import bcrypt from 'bcrypt';
import { EmailService } from '../../notification/services/email.service';
import { verifyCloudinaryConnection } from '../../../utils/cloudinary.util';

jest.mock('../../auth-account/models/user.model');
jest.mock('../../auth-account/models/blood-center.model');
jest.mock('../../auth-account/models/hospital.model');
jest.mock('../models/role.model');
jest.mock('../models/system-config.model');
jest.mock('../models/feature-toggle.model');
jest.mock('../models/audit-log.model');
jest.mock('../../campaign/models/campaign.model');
jest.mock('../../auth-account/models/badge.model');
jest.mock('../../notification/models/Notification');
jest.mock('../../notification/models/NotificationPreference');
jest.mock('../../notification/models/UserDevice');
jest.mock('../../chatbot/models/chat-conversation.model');
jest.mock('../../chatbot/models/chat-message.model');
jest.mock('../../../config/redis.config', () => ({
  redisConnection: {
    ping: jest.fn().mockResolvedValue('PONG'),
  },
}));
jest.mock('../../../config/queue.config', () => ({
  notificationQueue: {
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, delayed: 0, failed: 0 }),
  },
  scheduledTasksQueue: {
    getJobSchedulers: jest.fn().mockResolvedValue([{ name: 'publish-articles' }]),
  },
}));
jest.mock('../../notification/services/email.service', () => ({
  EmailService: { verifyConnection: jest.fn().mockResolvedValue(true) },
}));
jest.mock('../../../utils/cloudinary.util', () => ({
  verifyCloudinaryConnection: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../auth-account/models/donor-profile.model', () => ({
  DonorProfile: {
    find: jest.fn().mockImplementation(() => {
      const query: any = { lean: jest.fn().mockResolvedValue([]) };
      query.select = jest.fn().mockReturnValue(query);
      return query;
    }),
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
  },
}));

describe('Admin Module Unit Tests', () => {
  let adminUserService: AdminUserService;
  let adminRoleService: AdminRoleService;
  let adminConfigService: AdminConfigService;
  let adminToggleService: AdminToggleService;
  let adminMonitoringService: AdminMonitoringService;

  beforeEach(() => {
    adminUserService = new AdminUserService();
    adminRoleService = new AdminRoleService();
    adminConfigService = new AdminConfigService();
    adminToggleService = new AdminToggleService();
    adminMonitoringService = new AdminMonitoringService();
    (EmailService.verifyConnection as jest.Mock).mockResolvedValue(true);
    (verifyCloudinaryConnection as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('AdminUserService', () => {
    it('should query paginated users list with search filter', async () => {
      const mockUsers = [
        { _id: 'u1', fullName: 'Bác sĩ Lê Văn B', email: 'levanb@lifeline.vn', role: 'BloodCenterStaff', accountStatus: 'Active', roles: ['BloodCenterStaff'] },
      ];

      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockUsers),
            }),
          }),
        }),
      });
      (User.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await adminUserService.getUsers({ page: 1, limit: 10, search: 'Lê Văn B' });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should load an edit form user directly by MongoDB ID', async () => {
      const userId = '507f1f77bcf86cd799439011';
      (User.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: userId,
          idDocumentNumber: '012345678901',
          email: 'staff@lifeline.vn',
          fullName: 'Staff Member',
          roles: ['BloodCenterStaff'],
          role: 'BloodCenterStaff',
          accountStatus: 'Active',
          createdAt: new Date(),
        }),
      });
      (DonorProfile.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      const result = await adminUserService.getUserById(userId);

      expect(result.id).toBe(userId);
      expect(result.fullName).toBe('Staff Member');
      expect(result.roles).toEqual(['Donor', 'BloodCenterStaff']);
    });

    it('should always retain Donor as the required base role', () => {
      expect(validateAndNormalizeRoles({ roles: ['HospitalStaff'] })).toEqual({
        roles: ['Donor', 'HospitalStaff'],
        primaryRole: 'HospitalStaff',
      });
      expect(validateAndNormalizeRoles({ roles: ['Administrator'] })).toEqual({
        roles: ['Donor', 'Administrator'],
        primaryRole: 'Administrator',
      });
    });

    it('should reject identity fields in the admin update schema', () => {
      const result = AdminUpdateUserSchema.safeParse({
        params: { userId: '507f1f77bcf86cd799439011' },
        body: { fullName: 'Tên bị thay đổi', permanentAddress: 'Địa chỉ bị thay đổi' },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
          expect.arrayContaining(['body.fullName', 'body.permanentAddress'])
        );
      }
    });

    it('should require new accounts to start as Donor before any role elevation', () => {
      const result = AdminCreateUserSchema.safeParse({
        body: {
          idDocumentNumber: '012345678901',
          email: 'new.staff@example.com',
          fullName: 'Người Dùng Mới',
          password: 'StrongPassword123!',
          roles: ['Donor', 'HospitalStaff'],
          hospitalId: '507f1f77bcf86cd799439012',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject Full Name changes in the service layer', async () => {
      const donorUser = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Tên theo CCCD',
        email: 'identity@lifeline.vn',
        role: 'Donor',
        roles: ['Donor'],
        accountStatus: 'Active',
      };
      (User.findById as jest.Mock).mockResolvedValue(donorUser);

      await expect(
        adminUserService.updateUser(
          { id: '507f1f77bcf86cd799439099', name: 'admin@lifeline.vn' },
          donorUser._id,
          { fullName: 'Tên khác' },
          '127.0.0.1'
        )
      ).rejects.toThrow('dữ liệu định danh theo CCCD');
    });

    it('should soft delete user and write audit log into audit_logs collection', async () => {
      const mockUser = {
        _id: 'user_target_999',
        fullName: 'Trần Văn C',
        email: 'tranvanc@lifeline.vn',
        accountStatus: 'Active',
        idDocumentNumber: '012345678901',
        save: jest.fn().mockResolvedValue(true),
      };

      const mockAdminUser = {
        id: 'admin_001',
        name: 'Administrator',
      };

      (User.findById as jest.Mock).mockImplementation((id) => {
        if (id === 'user_target_999') return Promise.resolve(mockUser);
        if (id === 'admin_001') return Promise.resolve(mockAdminUser);
        return Promise.resolve(null);
      });
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({ _id: 'log_999' });

      const res = await adminUserService.softDeleteUser(
        mockAdminUser,
        'user_target_999',
        'Vô hiệu hóa theo yêu cầu kiểm toán',
        'tranvanc@lifeline.vn',
        '127.0.0.1'
      );

      expect(mockUser.accountStatus).toBe('Suspended');
      expect((mockUser as any).isDeleted).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(AdminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionCategory: 'User Management',
          actorUserId: 'admin_001',
          status: 'Success',
        })
      );
    });

    it('should prevent an administrator from demoting their own account', async () => {
      const mockAdmin = {
        _id: 'admin_001',
        email: 'admin@lifeline.vn',
        role: 'Administrator',
        roles: ['Administrator'],
        accountStatus: 'Active',
        isDeleted: false,
      };
      (User.findById as jest.Mock).mockResolvedValue(mockAdmin);

      await expect(
        adminUserService.updateUser(
          { id: 'admin_001', name: 'admin@lifeline.vn' },
          'admin_001',
          { roles: ['Donor'] },
          '127.0.0.1'
        )
      ).rejects.toThrow('cannot remove their own Administrator role');
    });

    it('should require a hospital assignment when granting HospitalStaff', async () => {
      const donorUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'donor@lifeline.vn',
        role: 'Donor',
        roles: ['Donor'],
        accountStatus: 'Active',
        isDeleted: false,
      };
      (User.findById as jest.Mock).mockResolvedValue(donorUser);

      await expect(
        adminUserService.updateUser(
          { id: '507f1f77bcf86cd799439099', name: 'admin@lifeline.vn' },
          donorUser._id,
          { roles: ['Donor', 'HospitalStaff'] },
          '127.0.0.1'
        )
      ).rejects.toThrow('Phải chọn bệnh viện công tác');
      expect(Hospital.findById).not.toHaveBeenCalled();
    });

    it('should require a blood center assignment when granting BloodCenterStaff', async () => {
      const donorUser = {
        _id: '507f1f77bcf86cd799439012',
        email: 'donor2@lifeline.vn',
        role: 'Donor',
        roles: ['Donor'],
        accountStatus: 'Active',
        isDeleted: false,
      };
      (User.findById as jest.Mock).mockResolvedValue(donorUser);

      await expect(
        adminUserService.updateUser(
          { id: '507f1f77bcf86cd799439099', name: 'admin@lifeline.vn' },
          donorUser._id,
          { roles: ['Donor', 'BloodCenterStaff'] },
          '127.0.0.1'
        )
      ).rejects.toThrow('Phải chọn trung tâm máu công tác');
      expect(BloodCenter.findById).not.toHaveBeenCalled();
    });

    it('should restore a suspended account without losing its history', async () => {
      const suspendedUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'returning@lifeline.vn',
        accountStatus: 'Suspended',
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: 'admin_001',
        deletionReason: 'Requested',
        sessionExpiresAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };
      (User.findById as jest.Mock).mockResolvedValue(suspendedUser);
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({ _id: 'restore_log' });

      await adminUserService.restoreUser(
        { id: 'admin_001', name: 'Administrator' },
        suspendedUser._id,
        suspendedUser.email,
        '127.0.0.1'
      );

      expect(suspendedUser.accountStatus).toBe('Active');
      expect(suspendedUser.isDeleted).toBe(false);
      expect(suspendedUser.save).toHaveBeenCalled();
    });

    it('should purge personal data transactionally and release identifiers', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const suspendedUser: any = {
        _id: userId,
        email: 'purge-me@lifeline.vn',
        idDocumentNumber: '012345678901',
        fullName: 'Purge Me',
        phone: '0901234567',
        passwordHash: 'old_hash',
        roles: ['Donor'],
        role: 'Donor',
        accountStatus: 'Suspended',
        isDeleted: true,
        save: jest.fn().mockResolvedValue(true),
      };
      const fakeSession = {
        withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
        endSession: jest.fn().mockResolvedValue(undefined),
      };
      const adminPassword = 'AdminPassword123!';
      const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(fakeSession as any);
      (User.findById as jest.Mock).mockImplementation((id: string) => {
        if (id === 'admin_001') return Promise.resolve({ passwordHash: adminPasswordHash });
        return { session: jest.fn().mockResolvedValue(suspendedUser) };
      });
      (DonorProfile.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });
      (UserDevice.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      (Notification.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      (NotificationPreference.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      (Badge.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      (ChatConversation.distinct as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue([]) });
      (ChatMessage.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
      (AdminAuditLog.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
      (AdminAuditLog.create as jest.Mock).mockResolvedValue([{ _id: 'purge_log' }]);

      await adminUserService.purgePersonalData(
        { id: 'admin_001', name: 'Administrator' },
        userId,
        'User requested a fresh registration.',
        'purge-me@lifeline.vn',
        adminPassword,
        '127.0.0.1'
      );

      expect(suspendedUser.email).toBe(`deleted+${userId}@lifeline.invalid`);
      expect(suspendedUser.idDocumentNumber).toBe(`deleted-${userId}`);
      expect(suspendedUser.privacyPurgedAt).toBeInstanceOf(Date);
      expect(fakeSession.withTransaction).toHaveBeenCalled();
      expect(fakeSession.endSession).toHaveBeenCalled();
    });
  });

  describe('AdminRoleService', () => {
    it('should return system roles list and available permissions matrix', async () => {
      const mockRoles = [
        { _id: 'r1', name: 'Administrator', permissions: ['*'], isSystemProtected: true, description: 'Admin' },
      ];
      (Role.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRoles),
      });

      const res = await adminRoleService.getRoles();

      expect(res.roles).toHaveLength(1);
      expect(res.availablePermissions.length).toBeGreaterThan(0);
    });

    it('should reject unknown permissions', async () => {
      await expect(
        adminRoleService.updateRolePermissions(
          { id: 'admin_001', name: 'Administrator' },
          'role_001',
          ['root:everything'],
          '127.0.0.1'
        )
      ).rejects.toThrow('Unsupported permissions');
    });

    it('should keep the system-protected Administrator role fully privileged', async () => {
      (Role.findById as jest.Mock).mockResolvedValue({ name: 'Administrator' });

      await expect(
        adminRoleService.updateRolePermissions(
          { id: 'admin_001', name: 'Administrator' },
          'role_001',
          ['roles:read', 'roles:write'],
          '127.0.0.1'
        )
      ).rejects.toThrow('must retain all permissions');
    });
  });

  describe('AdminConfigService', () => {
    it('should update system config parameter and record audit log', async () => {
      const mockConfig = {
        _id: 'c1',
        key: 'donationIntervalDays',
        value: 84,
        label: 'Thời gian tối thiểu giữa 2 lần hiến máu',
        save: jest.fn().mockResolvedValue(true),
      };
      (SystemConfig.findOne as jest.Mock).mockResolvedValue(mockConfig);
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({ _id: 'log_cfg' });

      const updated = await adminConfigService.updateConfig(
        { id: 'admin_001', name: 'Administrator' },
        'donationIntervalDays',
        90,
        '127.0.0.1'
      );

      expect(mockConfig.value).toBe(90);
      expect(mockConfig.save).toHaveBeenCalled();
      expect(AdminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionCategory: 'System Configuration',
        })
      );
    });

    it('should reject unsafe system configuration values', async () => {
      await expect(
        adminConfigService.updateConfig(
          { id: 'admin_001', name: 'Administrator' },
          'donationIntervalDays',
          -1,
          '127.0.0.1'
        )
      ).rejects.toThrow('Invalid value');
    });

    it('should repair invalid legacy configuration values while loading the matrix', async () => {
      (SystemConfig.bulkWrite as jest.Mock).mockResolvedValue({});
      (SystemConfig.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([{
          _id: { toString: () => 'config_1' },
          key: 'donationIntervalDays',
          value: 0,
          label: 'Minimum Donation Interval',
          category: 'Eligibility Rules',
        }]),
      });
      (SystemConfig.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await adminConfigService.getSystemConfigs();

      expect(result.categories[0].items[0].value).toBe(84);
      expect(SystemConfig.updateOne).toHaveBeenCalledWith(
        { _id: expect.anything() },
        expect.objectContaining({ $set: expect.objectContaining({ value: 84 }) })
      );
    });
  });

  describe('AdminToggleService', () => {
    it('should update feature toggle state and log audit entry', async () => {
      const mockToggle = {
        _id: 't1',
        key: 'ai_chatbot',
        name: 'AI Chatbot Assistant',
        isEnabled: false,
        updatedBy: 'System',
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };
      (FeatureToggle.findOne as jest.Mock).mockResolvedValue(mockToggle);
      (AdminAuditLog.create as jest.Mock).mockResolvedValue({ _id: 'log_tgl' });

      const updated = await adminToggleService.updateFeatureToggle(
        { id: 'admin_001', name: 'Administrator' },
        'ai_chatbot',
        true,
        '127.0.0.1'
      );

      expect(mockToggle.isEnabled).toBe(true);
      expect(mockToggle.save).toHaveBeenCalled();
      expect(AdminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionCategory: 'Feature Toggle',
        })
      );
    });

    it('should expose only the public feature state map without admin metadata', async () => {
      (FeatureToggle.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ key: 'sos_emergency_alerts', isEnabled: false }]),
      });

      const result = await adminToggleService.getPublicFeatureStates();

      expect(result.features.sos_emergency_alerts).toBe(false);
      expect(result.features.news_content_portal).toBe(true);
    });
  });

  describe('AdminMonitoringService', () => {
    it('should return system dashboard metrics and live diagnostics', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(150);
      (User.aggregate as jest.Mock).mockResolvedValue([]);
      (Campaign.aggregate as jest.Mock).mockResolvedValue([]);
      (AdminAuditLog.countDocuments as jest.Mock).mockResolvedValue(42);
      jest.spyOn(adminMonitoringService as any, 'pingHttpEndpoint').mockResolvedValue({
        status: 'Operational',
        latency: '1ms',
        details: 'OK',
      });

      const metrics = await adminMonitoringService.getDashboardMetrics();
      const diagnostics = await adminMonitoringService.runDiagnostics();

      expect(metrics.totalUsers).toBe(150);
      expect(diagnostics.overallStatus).toBeDefined();
      expect(diagnostics.services.length).toBeGreaterThan(0);
    });
  });

  describe('Admin request validation and authorization', () => {
    it('should return FEATURE_DISABLED instead of a permission error when a feature is off', async () => {
      (FeatureToggle.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue({ isEnabled: false }) });
      const req = { user: { role: 'BloodCenterStaff' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any;
      const next = jest.fn();

      await requireFeatureEnabled('sos_emergency_alerts')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'FEATURE_DISABLED', feature: 'sos_emergency_alerts' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should distinguish an unavailable toggle store from an intentionally disabled feature', async () => {
      (FeatureToggle.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('db unavailable')) });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any;

      await requireFeatureEnabled('news_content_portal')({} as any, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'FEATURE_CHECK_UNAVAILABLE' }));
    });

    it('should reject weak passwords and unsafe configuration payloads', () => {
      expect(AdminCreateUserSchema.safeParse({
        body: {
          idDocumentNumber: '012345678901',
          email: 'user@example.com',
          fullName: 'Test User',
          password: 'short',
          roles: ['Donor'],
        },
      }).success).toBe(false);
      expect(AdminUpdateConfigSchema.safeParse({
        body: { key: 'donationIntervalDays', value: -10 },
      }).success).toBe(false);
      expect(AdminPurgeUserDataSchema.safeParse({
        params: { userId: '507f1f77bcf86cd799439011' },
        body: {
          confirmationUsername: 'user@example.com',
          reason: 'User requested a privacy purge.',
        },
      }).success).toBe(false);
    });

    it('should enforce stored role permissions', async () => {
      (Role.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ name: 'Administrator', permissions: ['users:read'] }]),
      });
      const req = { user: { role: 'Administrator', roles: ['Administrator'] } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;
      const next = jest.fn();

      await authorizePermissions('users:write')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should migrate legacy HospitalStaff content permissions once', async () => {
      (Role.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([{
          _id: 'hospital-role',
          name: 'HospitalStaff',
          permissions: ['sos:read'],
          permissionsVersion: 1,
        }]),
      });
      (Role.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
      const req = { user: { role: 'HospitalStaff', roles: ['HospitalStaff'] } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;
      const next = jest.fn();

      await authorizePermissions('content:read', 'content:create')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(Role.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'hospital-role' }),
        expect.objectContaining({
          $addToSet: { permissions: { $each: ['content:read', 'content:create'] } },
          $set: { permissionsVersion: 2 },
        })
      );
    });

    it('should migrate BloodCenterStaff with sos:read for the SOS dashboard', async () => {
      (Role.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([{
          _id: 'blood-center-role',
          name: 'BloodCenterStaff',
          permissions: ['inventory:read'],
          permissionsVersion: 2,
        }]),
      });
      (Role.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
      const req = { user: { role: 'BloodCenterStaff', roles: ['BloodCenterStaff'] } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any;
      const next = jest.fn();

      await authorizePermissions('sos:read')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(Role.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'blood-center-role' }),
        expect.objectContaining({
          $addToSet: { permissions: { $each: ['sos:read'] } },
          $set: { permissionsVersion: 3 },
        })
      );
    });

    it('should respect permissions removed after the HospitalStaff migration', async () => {
      (Role.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([{
          _id: 'hospital-role',
          name: 'HospitalStaff',
          permissions: ['sos:read'],
          permissionsVersion: 2,
        }]),
      });
      const req = { user: { role: 'HospitalStaff', roles: ['HospitalStaff'] } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;
      const next = jest.fn();

      await authorizePermissions('content:read')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
      expect(Role.updateOne).not.toHaveBeenCalled();
    });
  });
});
