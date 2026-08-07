import { Router } from 'express';
import { SOSRequestController } from '../controllers/sos-request.controller';
import { validateRequest } from '../../../shared/validate.middleware';
import { authenticateJWT, authorizeRoles } from '../../../shared/auth.middleware';
import { CreateSOSRequestSchema, UpdateSOSStatusSchema, SOSQuerySchema, RespondSOSSchema, FulfillFromInventorySchema } from '../schemas/sos-request.schema';

const router = Router();

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('HospitalStaff', 'Administrator'),
  validateRequest(CreateSOSRequestSchema),
  SOSRequestController.createSOSRequest
);

router.get(
  '/',
  authenticateJWT,
  validateRequest(SOSQuerySchema),
  SOSRequestController.listSOSRequests
);

// NOTE: Debug routes – only available in development
if (process.env.NODE_ENV !== 'production') {
  const { User } = require('../../auth-account/models/user.model');
  const { Notification } = require('../../notification/models/Notification');
  const mongoose = require('mongoose');

  router.get('/debug-broadcast', async (req: any, res: any) => {
    try {
      const bcStaffUsers = await User.find({ role: 'BloodCenterStaff' });
      let count = 0;
      for (const staff of bcStaffUsers) {
        await Notification.create({
          recipientUserId: staff._id,
          type: 'SOS',
          channel: 'WebPush',
          title: `[TEST] CẤP CỨU MÁU TỪ DEBUG ROUTE`,
          body: `Đây là thông báo thử nghiệm để xem API có hoạt động không.`,
          sourceRefId: new mongoose.Types.ObjectId(),
          sourceRefType: 'SOSRequest',
          deliveryStatus: 'Sent'
        });
        count++;
      }
      res.json({ success: true, count, users: bcStaffUsers.map((u: any) => u.email) });
    } catch (error: any) {
      res.json({ success: false, error: error.message });
    }
  });

  const { BloodCenter } = require('../../auth-account/models/blood-center.model');
  const { DonorProfile } = require('../../auth-account/models/donor-profile.model');

  router.get('/debug-geonear', async (req: any, res: any) => {
    try {
      const centers = await BloodCenter.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [106.65, 10.75] },
            distanceField: 'distance',
            spherical: true
          }
        }
      ]);
      const donors = await DonorProfile.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [106.65, 10.75] },
            distanceField: 'distance',
            spherical: true
          }
        }
      ]);
      res.json({ success: true, centersCount: centers.length, donorsCount: donors.length });
    } catch (err: any) {
      res.json({ success: false, error: err.message });
    }
  });

  const { SOSEvaluationService } = require('../services/sos-evaluation.service');
  router.get('/debug-eval/:id', async (req: any, res: any) => {
    try {
      const evalLog = await SOSEvaluationService.evaluateAndPrioritize(req.params.id);
      res.json({ success: true, evalLog });
    } catch (err: any) {
      res.json({ success: false, error: err.message });
    }
  });
}

router.get(
  '/hospitals',
  SOSRequestController.listHospitals
);

router.get(
  '/:id',
  authenticateJWT,
  SOSRequestController.getSOSRequest
);

router.patch(
  '/:id/status',
  authenticateJWT,
  authorizeRoles('HospitalStaff', 'Administrator'),
  validateRequest(UpdateSOSStatusSchema),
  SOSRequestController.updateStatus
);

router.get(
  '/:id/evaluation-log',
  authenticateJWT,
  authorizeRoles('HospitalStaff', 'BloodCenterStaff', 'Administrator'),
  SOSRequestController.getEvaluationLog
);

router.post(
  '/:id/respond',
  authenticateJWT,
  authorizeRoles('Donor'),
  validateRequest(RespondSOSSchema),
  SOSRequestController.respondToSOS
);

router.post(
  '/:id/reopen',
  authenticateJWT,
  authorizeRoles('HospitalStaff', 'Administrator'),
  SOSRequestController.reopenSOSRequest
);

router.post(
  '/:id/fulfill-from-inventory',
  authenticateJWT,
  authorizeRoles('BloodCenterStaff', 'HospitalStaff', 'Administrator'),
  validateRequest(FulfillFromInventorySchema),
  SOSRequestController.fulfillFromInventory
);

export default router;
