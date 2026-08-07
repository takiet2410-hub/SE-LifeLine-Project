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
import { authenticateJWT } from '../../../shared/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// User notification endpoints
// NOTE: Debug routes only available in development
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug-all', async (req, res) => {
    const mongoose = require('mongoose');
    const notifs = await mongoose.model('Notification').find().lean();
    res.json(notifs);
  });
}

router.get('/', validateRequest(NotificationQuerySchema), NotificationController.listNotifications);
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug-seed', NotificationController.debugSeed);
}
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/preferences', NotificationController.getPreferences);
router.patch('/preferences', validateRequest(NotificationPreferenceSchema), NotificationController.updatePreferences);
// IMPORTANT: /read-all must come BEFORE /:id/* routes to avoid "read" being matched as an :id
router.patch('/read-all', validateRequest(MarkReadSchema), NotificationController.markMultipleAsRead);
router.get('/:id', NotificationController.getNotification);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/:id/sos-response', NotificationController.respondToSOS);
router.delete('/:id', NotificationController.deleteNotification);

// Admin/Internal endpoints (require staff role)
router.post('/send', validateRequest(SendNotificationSchema), NotificationController.sendNotification);
router.get('/templates', NotificationController.listTemplates);
router.post('/templates', validateRequest(NotificationTemplateSchema), NotificationController.createTemplate);
router.patch('/templates/:id', validateRequest(NotificationTemplateSchema), NotificationController.updateTemplate);

/**
 * @openapi
 * /api/v1/notifications/device-token:
 *   post:
 *     summary: Register FCM device token for push notifications
 *     tags: [Notifications]
 */
router.post(
  '/device-token',
  authenticateJWT,
  NotificationController.registerDeviceToken
);

/**
 * @openapi
 * /api/v1/notifications/device-token:
 *   delete:
 *     summary: Remove FCM device token (logout)
 *     tags: [Notifications]
 */
router.delete(
  '/device-token',
  authenticateJWT,
  NotificationController.removeDeviceToken
);

export default router;