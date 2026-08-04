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
// DEBUG ROUTE: GET ALL NOTIFS (NO AUTH)
router.get('/debug-all', async (req, res) => {
  const mongoose = require('mongoose');
  const notifs = await mongoose.model('Notification').find().lean();
  res.json(notifs);
});

router.get('/', validateRequest(NotificationQuerySchema), NotificationController.listNotifications);
router.get('/debug-seed', NotificationController.debugSeed);
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/preferences', NotificationController.getPreferences);
router.patch('/preferences', validateRequest(NotificationPreferenceSchema), NotificationController.updatePreferences);
router.get('/:id', NotificationController.getNotification);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/read', validateRequest(MarkReadSchema), NotificationController.markMultipleAsRead);
router.patch('/:id/sos-response', NotificationController.respondToSOS);
router.delete('/:id', NotificationController.deleteNotification);

// Admin/Internal endpoints (require staff role)
router.post('/send', validateRequest(SendNotificationSchema), NotificationController.sendNotification);
router.get('/templates', NotificationController.listTemplates);
router.post('/templates', validateRequest(NotificationTemplateSchema), NotificationController.createTemplate);
router.patch('/templates/:id', validateRequest(NotificationTemplateSchema), NotificationController.updateTemplate);

export default router;