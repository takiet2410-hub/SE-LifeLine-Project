import { Types } from 'mongoose';
import { SOSRequest } from '../models/sos-request.model';
import { SOSEvaluationLog } from '../models/sos-evaluation-log.model';
import { Notification } from '../../notification/models/Notification';
import { User } from '../../auth-account/models/user.model';
import { Hospital } from '../../auth-account/models/hospital.model';
import { BloodCenter } from '../../auth-account/models/blood-center.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import mongoose from 'mongoose';

export class SOSBroadcastService {
  public static async broadcastAlert(sosRequestId: string) {
    console.log(`[SOSBroadcastService] Triggered broadcast for SOS Request ${sosRequestId}`);
    
    const request = await SOSRequest.findById(sosRequestId);
    if (!request) throw new Error('SOS Request not found');

    const evalLog = await SOSEvaluationLog.findOne({ sosRequestId }).sort({ evaluatedAt: -1 });
    if (!evalLog) throw new Error('No evaluation log found to broadcast');

    // Fetch Hospital info for notification title/body
    const hospital = await Hospital.findById(request.hospitalId);
    const hospitalName = hospital?.name || 'A Hospital';

    // Prepare notifications array for bulk insert
    const notificationsToInsert = [];

    // 1. Notify Ranked Blood Centers (only staff from ranked centers)
    const notifiedCenters = [];
    const rankedCenterIds = evalLog.rankedBloodCenters.map(c => c.centerId.toString());
    
    if (rankedCenterIds.length > 0) {
      // Find BloodCenterStaff users who belong to these ranked centers
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

      const staffIds = bcStaffUsers.map(staff => staff._id.toString());
      if (staffIds.length > 0) {
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
            deepLink: `/sos-requests/${request._id.toString()}`,
            sourceRefId: request._id.toString(),
            sourceRefType: 'SOSRequest'
          };

          await NotificationService.sendNotification({
            recipientIds: staffIds,
            type: 'SOS',
            title: `CẤP CỨU: Cần ${request.requiredQuantityMl}ml máu ${request.bloodType} gấp`,
            body: `${hospitalName} yêu cầu cung cấp gấp ${request.requiredQuantityMl}ml máu ${request.bloodType} cho bệnh nhân cấp cứu. Hạn chót: ${request.fulfillmentDeadline ? request.fulfillmentDeadline.toLocaleDateString() : 'Không rõ'}`,
            payload: payload,
            channels: ['WebPush', 'InApp', 'Email'] as any
          });
          console.log(`[SOSBroadcastService] Broadcasted to ${staffIds.length} blood center staff`);
        } catch (err) {
          console.error(`[SOSBroadcastService] Error broadcasting to staff:`, err);
        }
      }
      console.log(`[SOSBroadcastService] No ranked blood centers to notify`);
    }

    // 2. Notify Ranked Donors
    const notifiedDonors = [];
    const donorIds = evalLog.rankedDonors.map(d => d.donorId);
    // Batch fetch all donor profiles to avoid O(N) DB calls
    const donorProfiles = await DonorProfile.find({ _id: { $in: donorIds } });
    
    // Find existing recipient IDs for this SOS request to avoid duplicates
    const existingNotifs = await Notification.find({
      sourceRefId: request._id,
      sourceRefType: 'SOSRequest'
    }).select('recipientUserId').lean();

    const alreadyNotifiedIds = new Set(
      existingNotifs.map((n: any) => n.recipientUserId.toString())
    );

    const newDonorIds = donorIds.filter((id: any) => !alreadyNotifiedIds.has(id.toString()));

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
          deepLink: `/sos-requests/${request._id.toString()}`,
          sourceRefId: request._id.toString(),
          sourceRefType: 'SOSRequest'
        };

        await NotificationService.sendNotification({
          recipientIds: newDonorIds.map((id: any) => id.toString()),
          type: 'SOS',
          title: `🚨 KHẨN CẤP: ${hospitalName} đang cần gấp nhóm máu ${request.bloodType}`,
          body: `Bệnh viện ${hospitalName} đang cần gấp ${request.requiredQuantityMl}ml máu nhóm ${request.bloodType}. Nhóm máu tương thích của bạn có thể cứu sống bệnh nhân ngay lúc này!`,
          payload: payload,
          channels: ['WebPush', 'InApp', 'Email'] as any
        });
        
        console.log(`[SOSBroadcastService] Broadcasted to ${newDonorIds.length} new donors (skipped ${donorIds.length - newDonorIds.length} duplicates)`);
      } catch (err) {
        console.error(`[SOSBroadcastService] Error during broadcast:`, err);
      }
    } else {
      console.log(`[SOSBroadcastService] All recipients already notified. Skipping.`);
    }

    // Update SOS status
    request.status = 'NotificationsDispatched';
    await request.save();

    // Update EvalLog stats
    evalLog.notificationDeliveryStats = {
      bloodCentersNotified: notifiedCenters.length,
      donorsNotified: notifiedDonors.length,
      timestamp: new Date()
    };
    await evalLog.save();

    console.log(`[SOSBroadcastService] Broadcast completed.`);
    return { success: true, notifiedCenters: notifiedCenters.length, notifiedDonors: notifiedDonors.length };
  }
}
