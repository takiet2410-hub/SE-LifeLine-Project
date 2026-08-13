import { AdminUserService } from '../services/admin-user.service';
import { AdminRoleService } from '../services/admin-role.service';
import { AdminConfigService } from '../services/admin-config.service';
import { AdminToggleService } from '../services/admin-toggle.service';
import { AdminMonitoringService } from '../services/admin-monitoring.service';
import { User } from '../../auth-account/models/user.model';
import { Role } from '../models/role.model';
import { SystemConfig } from '../models/system-config.model';
import { FeatureToggle } from '../models/feature-toggle.model';
import { AdminAuditLog } from '../models/audit-log.model';

jest.mock('../../auth-account/models/user.model');
jest.mock('../models/role.model');
jest.mock('../models/system-config.model');
jest.mock('../models/feature-toggle.model');
jest.mock('../models/audit-log.model');
jest.mock('../../auth-account/models/donor-profile.model', () => ({
  DonorProfile: {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    }),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      expect(mockUser.save).toHaveBeenCalled();
      expect(AdminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionCategory: 'User Management',
          actorUserId: 'admin_001',
          status: 'Success',
        })
      );
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
  });

  describe('AdminMonitoringService', () => {
    it('should return system dashboard metrics and live diagnostics', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(150);
      (AdminAuditLog.countDocuments as jest.Mock).mockResolvedValue(42);

      const metrics = await adminMonitoringService.getDashboardMetrics();
      const diagnostics = await adminMonitoringService.runDiagnostics();

      expect(metrics.totalUsers).toBe(150);
      expect(diagnostics.overallStatus).toBeDefined();
      expect(diagnostics.services.length).toBeGreaterThan(0);
    });
  });
});
