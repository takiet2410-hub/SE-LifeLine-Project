import { Response } from 'express';
import { AuthRequest } from '../../../shared/auth.middleware';
import { AdminUserService } from '../services/admin-user.service';
import { AdminRoleService } from '../services/admin-role.service';
import { AdminMonitoringService } from '../services/admin-monitoring.service';
import { AdminConfigService } from '../services/admin-config.service';
import { AdminToggleService } from '../services/admin-toggle.service';

const userService = new AdminUserService();
const roleService = new AdminRoleService();
const monitoringService = new AdminMonitoringService();
const configService = new AdminConfigService();
const toggleService = new AdminToggleService();

export class AdminController {
  // --- AD-UC-01 & AD-UC-02: User Management ---
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const data = await userService.getUsers(req.query);
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
    }
  }

  static async exportUsersCsv(req: AuthRequest, res: Response) {
    try {
      const csv = await userService.exportUsersCsv(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
      return res.status(200).send(csv);
    } catch (err: any) {
      return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
    }
  }

  static async createUser(req: AuthRequest, res: Response) {
    try {
      const adminUser = {
        id: req.user?._id?.toString() || 'admin_id',
        name: req.user?.email || 'Administrator',
      };
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const user = await userService.createUser(adminUser, req.body, ipAddress);
      return res.status(201).json({ message: 'User created successfully', user });
    } catch (err: any) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: err.message });
    }
  }

  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const adminUser = {
        id: req.user?._id?.toString() || 'admin_id',
        name: req.user?.email || 'Administrator',
      };
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const user = await userService.updateUser(adminUser, req.params.userId, req.body, ipAddress);
      return res.status(200).json({ message: 'User updated successfully', user });
    } catch (err: any) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: err.message });
    }
  }

  static async softDeleteUser(req: AuthRequest, res: Response) {
    try {
      const adminUser = {
        id: req.user?._id?.toString() || 'admin_id',
        name: req.user?.email || 'Administrator',
      };
      const { reason, confirmationUsername } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const result = await userService.softDeleteUser(
        adminUser,
        req.params.userId,
        reason,
        confirmationUsername,
        ipAddress
      );
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: err.message });
    }
  }

  // --- AD-UC-03: Roles & Permissions ---
  static async getRoles(req: AuthRequest, res: Response) {
    try {
      const data = await roleService.getRoles();
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
    }
  }

  static async updateRolePermissions(req: AuthRequest, res: Response) {
    try {
      const adminUser = {
        id: req.user?._id?.toString() || 'admin_id',
        name: req.user?.email || 'Administrator',
      };
      const { permissions } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const role = await roleService.updateRolePermissions(
        adminUser,
        req.params.roleId,
        permissions,
        ipAddress
      );
      return res.status(200).json({ message: 'Role permissions updated successfully', role });
    } catch (err: any) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: err.message });
    }
  }

  // --- AD-UC-04: Monitoring, Logs & Dashboard ---
  static async getActivityLogs(req: AuthRequest, res: Response) {
    try {
      const data = await monitoringService.getActivityLogs(req.query);
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
    }
  }

  static async exportLogsCsv(req: AuthRequest, res: Response) {
    try {
      const csv = await monitoringService.exportLogsCsv(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="activity_logs_export.csv"');
      return res.status(200).send(csv);
    } catch (err: any) {
      return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
    }
  }

  static async getDashboardMetrics(req: AuthRequest, res: Response) {
    try {
      const data = await monitoringService.getDashboardMetrics();
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
    }
  }

  static async runDiagnostics(req: AuthRequest, res: Response) {
    try {
      const data = await monitoringService.runDiagnostics();
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
    }
  }

  // --- AD-UC-05: System Configurations ---
  static async getConfigs(req: AuthRequest, res: Response) {
    try {
      const data = await configService.getSystemConfigs();
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
    }
  }

  static async updateConfig(req: AuthRequest, res: Response) {
    try {
      const adminUser = {
        id: req.user?._id?.toString() || 'admin_id',
        name: req.user?.email || 'Administrator',
      };
      const { key, value } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const config = await configService.updateConfig(adminUser, key, value, ipAddress);
      return res.status(200).json({ message: 'Configuration updated successfully', config });
    } catch (err: any) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: err.message });
    }
  }

  // --- AD-UC-06: Feature Toggles ---
  static async getToggles(req: AuthRequest, res: Response) {
    try {
      const data = await toggleService.getFeatureToggles();
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
    }
  }

  static async updateToggle(req: AuthRequest, res: Response) {
    try {
      const adminUser = {
        id: req.user?._id?.toString() || 'admin_id',
        name: req.user?.email || 'Administrator',
      };
      const { isEnabled } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const toggle = await toggleService.updateFeatureToggle(
        adminUser,
        req.params.key,
        isEnabled,
        ipAddress
      );
      return res.status(200).json({ message: 'Feature toggle updated successfully', toggle });
    } catch (err: any) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: err.message });
    }
  }
}
