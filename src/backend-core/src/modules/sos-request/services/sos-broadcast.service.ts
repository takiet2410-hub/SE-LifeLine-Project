import { SOSRequest } from '../models/sos-request.model';
import { SOSEvaluationLog } from '../models/sos-evaluation-log.model';
import { Notification } from '../../notification/models/Notification';
import { User } from '../../auth-account/models/user.model';
import { Hospital } from '../../auth-account/models/hospital.model';
import { BloodCenter } from '../../auth-account/models/blood-center.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import mongoose from 'mongoose';
import { isFeatureEnabled } from '../../admin/services/admin-toggle.service';

export class SOSBroadcastService {
  public static async broadcastAlert(sosRequestId: string) {
    if (!(await isFeatureEnabled('sos_emergency_alerts'))) {
      console.log(`[SOSBroadcastService] SOS feature disabled. Skipping broadcast for ${sosRequestId}.`);
      return { skipped: true, reason: 'FEATURE_DISABLED', notifiedCenters: [], notifiedDonors: [] };
    }
    console.log(`[SOSBroadcastService] Triggered broadcast for SOS Request ${sosRequestId}`);
    
    const request = await SOSRequest.findById(sosRequestId);
    if (!request) throw new Error('SOS Request not found');
    if (!['Pending', 'EvaluationInProgress', 'NotificationsDispatched'].includes(request.status) || request.fulfillmentDeadline <= new Date()) {
      if (request.fulfillmentDeadline <= new Date() && !['Fulfilled', 'Cancelled', 'Expired'].includes(request.status)) {
        request.status = 'Expired';
        await request.save();
      }
      return { skipped: true, reason: 'SOS_NOT_ACTIVE', notifiedCenters: [], notifiedDonors: [] };
    }

    const evalLog = await SOSEvaluationLog.findOne({ sosRequestId }).sort({ evaluatedAt: -1 });
    if (!evalLog) throw new Error('No evaluation log found to broadcast');

    // Fetch Hospital info for notification title/body
    const hospital = await Hospital.findById(request.hospitalId);
    const hospitalName = hospital?.name || 'A Hospital';

    // ─── 1. Notify Ranked Blood Centers (dedup) ───────────────────────────────
    const notifiedCenters: any[] = [];
    const rankedCenterIds = evalLog.rankedBloodCenters.map(c => c.centerId.toString());
    
    if (rankedCenterIds.length > 0) {
      const rankedCenters = await BloodCenter.find({ _id: { $in: rankedCenterIds } }).select('_id').lean();
      const rankedCenterObjectIds = rankedCenters.map(c => c._id);
      
      const bcStaffUsers = await User.find({ 
        role: 'BloodCenterStaff',
        bloodCenterId: { $in: rankedCenterObjectIds }
      });
      
      console.log(`[SOSBroadcastService] Found ${bcStaffUsers.length} BloodCenterStaff users in ${rankedCenterIds.length} ranked centers`);
      
      for (const center of evalLog.rankedBloodCenters) {
        console.log(`[SOSBroadcastService] -> Selected BloodCenter ID: ${center.centerId}`);
        notifiedCenters.push(center.centerId);
      }

      const allStaffIds = bcStaffUsers.map(staff => staff._id.toString());

      if (allStaffIds.length > 0) {
        // ── Dedup: only send to staff who haven't received this SOS notification yet ──
        const existingStaffNotifs = await Notification.find({
          sourceRefId: request._id,
          sourceRefType: 'SOSRequest',
          recipientUserId: { $in: allStaffIds }
        }).select('recipientUserId').lean();

        const alreadyNotifiedStaffIds = new Set(
          existingStaffNotifs.map((n: any) => n.recipientUserId.toString())
        );
        const newStaffIds = allStaffIds.filter(id => !alreadyNotifiedStaffIds.has(id));

        if (newStaffIds.length > 0) {
          try {
            const { NotificationService } = await import('../../notification/services/notification.service');
            const payload = {
              hospitalName: hospitalName,
              hospitalAddress: hospital?.address || 'Address not available',
              hospitalPhone: hospital?.contactPhone || 'N/A',
              patientReference: request.patientReference || 'N/A',
              requiredQuantityMl: request.requiredQuantityMl,
              fulfillmentDeadline: request.fulfillmentDeadline,
              bloodType: request.bloodType,
              urgencyLevel: request.urgencyLevel,
              hospitalLocation: hospital?.location,
              deepLink: `/bc/sos-requests/${request._id.toString()}`,
              sourceRefId: request._id.toString(),
              sourceRefType: 'SOSRequest'
            };

            await NotificationService.sendNotification({
              recipientIds: newStaffIds,
              type: 'SOS',
              title: `CẤP CỨU: Cần ${request.requiredQuantityMl}ml máu ${request.bloodType} gấp`,
              body: `${hospitalName} yêu cầu cung cấp gấp ${request.requiredQuantityMl}ml máu ${request.bloodType} cho bệnh nhân cấp cứu. Hạn chót: ${request.fulfillmentDeadline ? request.fulfillmentDeadline.toLocaleDateString() : 'Không rõ'}`,
              payload: payload,
              channels: ['WebPush', 'InApp'] as any,
              allowedRecipientRoles: ['BloodCenterStaff']
            });
            console.log(`[SOSBroadcastService] Broadcasted to ${newStaffIds.length} blood center staff (skipped ${alreadyNotifiedStaffIds.size} already notified)`);
          } catch (err) {
            console.error(`[SOSBroadcastService] Error broadcasting to staff:`, err);
          }
        } else {
          console.log(`[SOSBroadcastService] All BloodCenter staff already notified. Skipping.`);
        }
      }
    }

    // ─── 2. Notify Ranked Donors (dedup already existed) ──────────────────────
    const notifiedDonors: any[] = [];
    const evaluatedDonorIds = evalLog.rankedDonors.map(d => d.donorId);
    const activeDonorUsers = await User.find({
      _id: { $in: evaluatedDonorIds },
      role: 'Donor',
      accountStatus: 'Active',
      isDeleted: { $ne: true },
    }).select('_id').lean();
    const donorIds = activeDonorUsers.map((user: any) => user._id);
    
    // Find existing recipient IDs for this SOS request to avoid duplicates
    const existingNotifs = await Notification.find({
      sourceRefId: request._id,
      sourceRefType: 'SOSRequest',
      recipientUserId: { $in: donorIds }
    }).select('recipientUserId').lean();

    const alreadyNotifiedDonorIds = new Set(
      existingNotifs.map((n: any) => n.recipientUserId.toString())
    );

    const newDonorIds = donorIds.filter((id: any) => !alreadyNotifiedDonorIds.has(id.toString()));

    if (newDonorIds.length > 0) {
      try {
        const { NotificationService } = await import('../../notification/services/notification.service');
        const payload = {
          hospitalName: hospitalName,
          hospitalAddress: hospital?.address || 'Address not available',
          hospitalPhone: hospital?.contactPhone || 'N/A',
          patientReference: request.patientReference || 'N/A',
          requiredQuantityMl: request.requiredQuantityMl,
          fulfillmentDeadline: request.fulfillmentDeadline,
          bloodType: request.bloodType,
          urgencyLevel: request.urgencyLevel,
          hospitalLocation: hospital?.location,
          deepLink: `/donor/sos-requests/${request._id.toString()}`,
          sourceRefId: request._id.toString(),
          sourceRefType: 'SOSRequest',
          audienceRole: 'Donor',
          notificationKind: 'SOS_DONOR_APPEAL'
        };

        await NotificationService.sendNotification({
          recipientIds: newDonorIds.map((id: any) => id.toString()),
          type: 'SOS',
          title: `🚨 KHẨN CẤP: ${hospitalName} đang cần gấp nhóm máu ${request.bloodType}`,
          body: `Bệnh viện ${hospitalName} đang cần gấp ${request.requiredQuantityMl}ml máu nhóm ${request.bloodType}. Nhóm máu tương thích của bạn có thể cứu sống bệnh nhân ngay lúc này!`,
          payload: payload,
          channels: ['WebPush', 'InApp', 'Email'] as any,
          allowedRecipientRoles: ['Donor']
        });

        // ── Fix Bug #2: actually push the notified donors into the array ──
        notifiedDonors.push(...newDonorIds);
        console.log(`[SOSBroadcastService] Broadcasted to ${newDonorIds.length} new donors (skipped ${donorIds.length - newDonorIds.length} duplicates)`);
      } catch (err) {
        console.error(`[SOSBroadcastService] Error during donor broadcast:`, err);
      }
    } else {
      console.log(`[SOSBroadcastService] All donors already notified. Skipping.`);
    }

    // ─── 3. Update SOS status & EvalLog stats ────────────────────────────────
    await SOSRequest.updateOne(
      {
        _id: request._id,
        status: { $in: ['Pending', 'EvaluationInProgress', 'NotificationsDispatched'] },
        fulfillmentDeadline: { $gt: new Date() },
      },
      { $set: { status: 'NotificationsDispatched' } }
    );

    evalLog.notificationDeliveryStats = {
      bloodCentersNotified: notifiedCenters.length,
      donorsNotified: notifiedDonors.length,
      timestamp: new Date()
    };
    await evalLog.save();

    console.log(`[SOSBroadcastService] Broadcast completed. Centers: ${notifiedCenters.length}, Donors: ${notifiedDonors.length}`);
    return { success: true, notifiedCenters: notifiedCenters.length, notifiedDonors: notifiedDonors.length };
  }
}
