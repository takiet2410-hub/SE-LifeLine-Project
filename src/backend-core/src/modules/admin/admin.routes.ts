import { Router } from 'express';
import { authenticateJWT, authorizePermissions, authorizeRoles } from '../../shared/auth.middleware';
import { AdminController } from './controllers/admin.controller';
import { validateRequest } from '../../shared/validate.middleware';
import {
  AdminCreateUserSchema,
  AdminDeleteUserSchema,
  AdminLogListSchema,
  AdminPurgeUserDataSchema,
  AdminRestoreUserSchema,
  AdminRolePermissionsSchema,
  AdminUpdateConfigSchema,
  AdminUpdateToggleSchema,
  AdminUpdateUserSchema,
  AdminUserIdSchema,
  AdminUserListSchema,
} from './schemas/admin.schema';
import { auditAdminFailures } from './admin-audit.middleware';

const router = Router();

// Public read-only status used by clients to render disabled-feature states.
router.get('/feature-status', AdminController.getFeatureStatus);

// Protect all admin routes with JWT auth and Administrator role requirement
router.use(authenticateJWT, authorizeRoles('Administrator'));
router.use(auditAdminFailures);

// AD-UC-01 & AD-UC-02: User Management
router.get('/users', authorizePermissions('users:read'), validateRequest(AdminUserListSchema), AdminController.getUsers);
router.get('/users/export', authorizePermissions('users:read'), validateRequest(AdminUserListSchema), AdminController.exportUsersCsv);
router.get('/users/:userId', authorizePermissions('users:read'), validateRequest(AdminUserIdSchema), AdminController.getUserById);
router.post('/users', authorizePermissions('users:write'), validateRequest(AdminCreateUserSchema), AdminController.createUser);
router.put('/users/:userId', authorizePermissions('users:write'), validateRequest(AdminUpdateUserSchema), AdminController.updateUser);
router.delete('/users/:userId', authorizePermissions('users:write'), validateRequest(AdminDeleteUserSchema), AdminController.softDeleteUser);
router.post('/users/:userId/restore', authorizePermissions('users:write'), validateRequest(AdminRestoreUserSchema), AdminController.restoreUser);
router.post('/users/:userId/purge-personal-data', authorizePermissions('users:write'), validateRequest(AdminPurgeUserDataSchema), AdminController.purgePersonalData);

// AD-UC-03: Roles & Permissions
router.get('/roles', authorizePermissions('roles:read'), AdminController.getRoles);
router.put('/roles/:roleId/permissions', authorizePermissions('roles:write'), validateRequest(AdminRolePermissionsSchema), AdminController.updateRolePermissions);

// AD-UC-04: System Monitoring & Activity Logs
router.get('/logs', authorizePermissions('system:logs'), validateRequest(AdminLogListSchema), AdminController.getActivityLogs);
router.get('/logs/export', authorizePermissions('system:logs'), validateRequest(AdminLogListSchema), AdminController.exportLogsCsv);
router.get('/dashboard', authorizePermissions('system:logs'), AdminController.getDashboardMetrics);
router.post('/diagnostics', authorizePermissions('system:logs'), AdminController.runDiagnostics);

// AD-UC-05: System Configurations
router.get('/config', authorizePermissions('system:config'), AdminController.getConfigs);
router.put('/config', authorizePermissions('system:config'), validateRequest(AdminUpdateConfigSchema), AdminController.updateConfig);

// AD-UC-06: Feature Toggles
router.get('/toggles', authorizePermissions('system:toggles'), AdminController.getToggles);
router.put('/toggles/:key', authorizePermissions('system:toggles'), validateRequest(AdminUpdateToggleSchema), AdminController.updateToggle);

export default router;
