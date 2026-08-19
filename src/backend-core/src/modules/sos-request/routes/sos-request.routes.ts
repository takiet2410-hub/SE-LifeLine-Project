import { Router } from 'express';
import { SOSRequestController } from '../controllers/sos-request.controller';
import { validateRequest } from '../../../shared/validate.middleware';
import { authenticateJWT, authorizePermissions, authorizeRoles } from '../../../shared/auth.middleware';
import { CreateSOSRequestSchema, UpdateSOSStatusSchema, SOSQuerySchema, RespondSOSSchema, FulfillFromInventorySchema, RecordDirectDonationSchema } from '../schemas/sos-request.schema';
import { requireFeatureEnabled } from '../../admin/feature-toggle.middleware';

const router = Router();
const sosFeature = requireFeatureEnabled('sos_emergency_alerts');

const authorizeSOSDetailAccess = async (req: any, res: any, next: any) => {
  const roles = new Set([req.user?.role, ...(Array.isArray(req.user?.roles) ? req.user.roles : [])]);
  if (roles.has('Donor') && !roles.has('HospitalStaff') && !roles.has('BloodCenterStaff') && !roles.has('Administrator')) {
    return next();
  }
  return authorizePermissions('sos:read')(req, res, next);
};

router.post(
  '/',
  authenticateJWT,
  sosFeature,
  authorizeRoles('HospitalStaff', 'Administrator'),
  authorizePermissions('sos:create'),
  validateRequest(CreateSOSRequestSchema),
  SOSRequestController.createSOSRequest
);

router.get(
  '/',
  authenticateJWT,
  sosFeature,
  authorizeRoles('HospitalStaff', 'BloodCenterStaff', 'Administrator'),
  authorizePermissions('sos:read'),
  validateRequest(SOSQuerySchema),
  SOSRequestController.listSOSRequests
);

// NOTE: Debug routes – only available in development
if (process.env.NODE_ENV !== 'production') {
  const { User } = require('../../auth-account/models/user.model');
  const { Notification } = require('../../notification/models/Notification');
  const mongoose = require('mongoose');

  const debugAuth = [authenticateJWT, sosFeature, authorizeRoles('Administrator'), authorizePermissions('system:logs')];

  router.get('/debug-broadcast', ...debugAuth, async (req: any, res: any) => {
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

  router.get('/debug-geonear', ...debugAuth, async (req: any, res: any) => {
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
  router.get('/debug-eval/:id', ...debugAuth, async (req: any, res: any) => {
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
  sosFeature,
  SOSRequestController.listHospitals
);

router.get(
  '/:id',
  authenticateJWT,
  sosFeature,
  authorizeRoles('Donor', 'HospitalStaff', 'BloodCenterStaff', 'Administrator'),
  authorizeSOSDetailAccess,
  SOSRequestController.getSOSRequest
);

router.patch(
  '/:id/status',
  authenticateJWT,
  sosFeature,
  authorizeRoles('HospitalStaff', 'Administrator'),
  authorizePermissions('sos:cancel'),
  validateRequest(UpdateSOSStatusSchema),
  SOSRequestController.updateStatus
);

router.get(
  '/:id/evaluation-log',
  authenticateJWT,
  sosFeature,
  authorizeRoles('HospitalStaff', 'BloodCenterStaff', 'Administrator'),
  authorizePermissions('sos:read'),
  SOSRequestController.getEvaluationLog
);

router.post(
  '/:id/respond',
  authenticateJWT,
  sosFeature,
  authorizeRoles('Donor'),
  validateRequest(RespondSOSSchema),
  SOSRequestController.respondToSOS
);

router.post(
  '/:id/reopen',
  authenticateJWT,
  sosFeature,
  authorizeRoles('HospitalStaff', 'Administrator'),
  authorizePermissions('sos:create'),
  SOSRequestController.reopenSOSRequest
);

router.post(
  '/:id/fulfill-from-inventory',
  authenticateJWT,
  sosFeature,
  authorizeRoles('BloodCenterStaff'),
  authorizePermissions('inventory:stock_out'),
  validateRequest(FulfillFromInventorySchema),
  SOSRequestController.fulfillFromInventory
);

// Hospital confirms they received the blood from BloodCenter (HospitalStaff ONLY)
router.patch(
  '/:id/confirm-received',
  authenticateJWT,
  sosFeature,
  authorizeRoles('HospitalStaff'),
  authorizePermissions('sos:read'),
  SOSRequestController.confirmReceived
);

// Hospital confirms receipt of a specific shipment from a Blood Center
router.patch(
  '/:id/shipments/:shipmentId/confirm-received',
  authenticateJWT,
  sosFeature,
  authorizeRoles('HospitalStaff'),
  authorizePermissions('sos:read'),
  SOSRequestController.confirmShipmentReceived
);

// Hospital records direct blood donation from a Donor (Fast Track Code or Walk-in)
router.post(
  '/:id/direct-donations',
  authenticateJWT,
  sosFeature,
  authorizeRoles('HospitalStaff'),
  authorizePermissions('sos:read'),
  validateRequest(RecordDirectDonationSchema),
  SOSRequestController.recordDirectDonation
);

// Hospital looks up Donor info by Fast Track Code, CCCD, Phone, or Name
router.get(
  '/:id/lookup-donor',
  authenticateJWT,
  sosFeature,
  authorizeRoles('HospitalStaff'),
  authorizePermissions('sos:read'),
  SOSRequestController.lookupDonor
);

export default router;
