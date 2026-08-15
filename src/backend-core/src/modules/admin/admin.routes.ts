import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../../shared/auth.middleware';
import { AdminController } from './controllers/admin.controller';

const router = Router();

// Protect all admin routes with JWT auth and Administrator role requirement
router.use(authenticateJWT, authorizeRoles('Administrator'));

// AD-UC-01 & AD-UC-02: User Management
router.get('/users', AdminController.getUsers);
router.get('/users/export', AdminController.exportUsersCsv);
router.post('/users', AdminController.createUser);
router.put('/users/:userId', AdminController.updateUser);
router.delete('/users/:userId', AdminController.softDeleteUser);
router.delete('/users/:userId/permanent', AdminController.hardDeleteUser);

// AD-UC-03: Roles & Permissions
router.get('/roles', AdminController.getRoles);
router.put('/roles/:roleId/permissions', AdminController.updateRolePermissions);

// AD-UC-04: System Monitoring & Activity Logs
router.get('/logs', AdminController.getActivityLogs);
router.get('/logs/export', AdminController.exportLogsCsv);
router.get('/dashboard', AdminController.getDashboardMetrics);
router.post('/diagnostics', AdminController.runDiagnostics);

// AD-UC-05: System Configurations
router.get('/config', AdminController.getConfigs);
router.put('/config', AdminController.updateConfig);

// AD-UC-06: Feature Toggles
router.get('/toggles', AdminController.getToggles);
router.put('/toggles/:key', AdminController.updateToggle);

export default router;
