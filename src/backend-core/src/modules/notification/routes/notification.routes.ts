import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { validateRequest } from '../../../shared/validate.middleware';
import { 
  NotificationQuerySchema, 
  MarkReadSchema, 
  NotificationPreferenceSchema,
  SendNotificationSchema,
  NotificationTemplateSchema 
} from '../schemas/notification.schema';
import { authenticateJWT, authorizePermissions, authorizeRoles } from '../../../shared/auth.middleware';
import { requireFeatureEnabled } from '../../admin/feature-toggle.middleware';

const router = Router();
const sosFeature = requireFeatureEnabled('sos_emergency_alerts');

// All routes require authentication
router.use(authenticateJWT);

// User notification endpoints
// NOTE: Debug routes only available in development
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug-all', authorizeRoles('Administrator'), authorizePermissions('system:logs'), async (req, res) => {
    const mongoose = require('mongoose');
    const notifs = await mongoose.model('Notification').find().lean();
    res.json(notifs);
  });
}

router.get('/', validateRequest(NotificationQuerySchema), NotificationController.listNotifications);
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug-seed', authorizeRoles('Administrator'), authorizePermissions('system:logs'), NotificationController.debugSeed);
}
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/preferences', NotificationController.getPreferences);
router.patch('/preferences', validateRequest(NotificationPreferenceSchema), NotificationController.updatePreferences);
// IMPORTANT: /read-all must come BEFORE /:id/* routes to avoid "read" being matched as an :id
router.patch('/read-all', validateRequest(MarkReadSchema), NotificationController.markMultipleAsRead);

// Admin/Internal endpoints must be declared before /:id and require explicit RBAC.
router.post(
  '/send',
  requireFeatureEnabled('sos_emergency_alerts', (req) => req.body?.type === 'SOS'),
  authorizeRoles('Administrator'),
  authorizePermissions('notifications:send'),
  validateRequest(SendNotificationSchema),
  NotificationController.sendNotification
);
router.get('/templates', authorizeRoles('Administrator'), authorizePermissions('notifications:templates'), NotificationController.listTemplates);
router.post('/templates', authorizeRoles('Administrator'), authorizePermissions('notifications:templates'), validateRequest(NotificationTemplateSchema), NotificationController.createTemplate);
router.patch('/templates/:id', authorizeRoles('Administrator'), authorizePermissions('notifications:templates'), validateRequest(NotificationTemplateSchema), NotificationController.updateTemplate);

/**
 * @openapi
 * /api/v1/notifications/device-token:
 *   post:
 *     summary: Register FCM device token for push notifications
 *     tags: [Notifications]
 *   delete:
 *     summary: Remove FCM device token (logout)
 *     tags: [Notifications]
 */
// Keep static device-token routes before /:id so "device-token" is never treated as a notification id.
router.post('/device-token', NotificationController.registerDeviceToken);
router.delete('/device-token', NotificationController.removeDeviceToken);

router.get('/:id', NotificationController.getNotification);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/:id/sos-response', sosFeature, NotificationController.respondToSOS);
router.delete('/:id', NotificationController.deleteNotification);

export default router;
