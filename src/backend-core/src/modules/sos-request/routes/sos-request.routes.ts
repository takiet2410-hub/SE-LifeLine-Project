import { Router } from 'express';
import { SOSRequestController } from '../controllers/sos-request.controller';
import { validateRequest } from '../../../shared/validate.middleware';
import { CreateSOSRequestSchema, UpdateSOSStatusSchema, SOSQuerySchema, RespondSOSSchema } from '../schemas/sos-request.schema';

const router = Router();

router.post(
  '/',
  validateRequest(CreateSOSRequestSchema),
  SOSRequestController.createSOSRequest
);

router.get(
  '/',
  validateRequest(SOSQuerySchema),
  SOSRequestController.listSOSRequests
);

import { User } from '../../auth-account/models/user.model';
import { Notification } from '../../notification/models/Notification';
import mongoose from 'mongoose';

router.get('/debug-broadcast', async (req, res) => {
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
    res.json({ success: true, count, users: bcStaffUsers.map(u => u.email) });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

import { BloodCenter } from '../../auth-account/models/blood-center.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';

router.get('/debug-geonear', async (req, res) => {
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
    res.json({ success: false, error: err.message, stack: err.stack });
  }
});

import { SOSEvaluationService } from '../services/sos-evaluation.service';
router.get('/debug-eval/:id', async (req, res) => {
  try {
    const evalLog = await SOSEvaluationService.evaluateAndPrioritize(req.params.id);
    res.json({ success: true, evalLog });
  } catch (err: any) {
    res.json({ success: false, error: err.message, stack: err.stack });
  }
});

router.get(
  '/:id',
  SOSRequestController.getSOSRequest
);

router.patch(
  '/:id/status',
  validateRequest(UpdateSOSStatusSchema),
  SOSRequestController.updateStatus
);

router.get(
  '/:id/evaluation-log',
  SOSRequestController.getEvaluationLog
);

router.post(
  '/:id/respond',
  validateRequest(RespondSOSSchema),
  SOSRequestController.respondToSOS
);

export default router;
