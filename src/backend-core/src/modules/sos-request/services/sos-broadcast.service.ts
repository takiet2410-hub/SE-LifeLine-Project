import { Types } from 'mongoose';
import { SOSRequest } from '../models/sos-request.model';
import { SOSEvaluationLog } from '../models/sos-evaluation-log.model';
import { Notification } from '../../notification/models/Notification';
import { User } from '../../auth-account/models/user.model';
import { Hospital } from '../../auth-account/models/hospital.model';
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

    // 1. Notify Ranked Blood Centers (Actually notify all BloodCenterStaff in the system for this demo)
    const notifiedCenters = [];
    const bcStaffUsers = await User.find({ role: 'BloodCenterStaff' });
    
    for (const center of evalLog.rankedBloodCenters) {
      console.log(`[SOSBroadcastService] -> Selected BloodCenter ID: ${center.centerId}`);
      notifiedCenters.push(center.centerId);
    }

    // Create notifications for BC Staff
    console.log(`[SOSBroadcastService] Found ${bcStaffUsers.length} BloodCenterStaff users`);
    for (const staff of bcStaffUsers) {
      try {
        console.log(`[SOSBroadcastService] Creating notification for staff: ${staff.email}`);
        await Notification.create({
          recipientUserId: staff._id,
          type: 'SOS',
          channel: 'WebPush',
          title: `CẤP CỨU: Cần ${request.requiredQuantityMl}ml máu ${request.bloodType} gấp`,
          body: `${hospitalName} yêu cầu cung cấp gấp ${request.requiredQuantityMl}ml máu ${request.bloodType} cho bệnh nhân cấp cứu. Hạn chót: ${request.fulfillmentDeadline ? request.fulfillmentDeadline.toLocaleDateString() : 'Không rõ'}`,
          sourceRefId: request._id,
          sourceRefType: 'SOSRequest',
          deliveryStatus: 'Sent',
          payload: {
            hospitalName: hospitalName,
            hospitalAddress: hospital?.address || 'Address not available',
            patientReference: request.patientReference || 'N/A',
            requiredQuantityMl: request.requiredQuantityMl,
            fulfillmentDeadline: request.fulfillmentDeadline,
            bloodType: request.bloodType,
            urgencyLevel: request.urgencyLevel,
            hospitalLocation: hospital?.location,
          }
        });
        console.log(`[SOSBroadcastService] Successfully created notification for ${staff.email}`);
      } catch (err) {
        console.error(`[SOSBroadcastService] Error creating notification for ${staff.email}:`, err);
      }
    }

    // 2. Notify Ranked Donors
    const notifiedDonors = [];
    const DonorProfileModel = mongoose.model('DonorProfile');
    for (const donor of evalLog.rankedDonors) {
      console.log(`[SOSBroadcastService] -> Selected Donor ID: ${donor.donorId}`);
      notifiedDonors.push(donor.donorId);
      
      try {
        const donorProfile = await DonorProfileModel.findById(donor.donorId);
        if (donorProfile && donorProfile.userId) {
          console.log(`[SOSBroadcastService] Creating notification for Donor User ID: ${donorProfile.userId}`);
          await Notification.create({
            recipientUserId: donorProfile.userId,
            type: 'SOS',
            channel: 'WebPush',
            title: `KHẨN CẤP: ${hospitalName} đang cần máu ${request.bloodType}`,
            body: `Nhóm máu ${request.bloodType} của bạn có thể cứu sống một bệnh nhân ngay lúc này. Xin vui lòng hiến máu khẩn cấp!`,
            sourceRefId: request._id,
            sourceRefType: 'SOSRequest',
            deliveryStatus: 'Sent',
            payload: {
              hospitalName: hospitalName,
              hospitalAddress: hospital?.address || 'Address not available',
              patientReference: request.patientReference || 'N/A',
              requiredQuantityMl: request.requiredQuantityMl,
              fulfillmentDeadline: request.fulfillmentDeadline,
              bloodType: request.bloodType,
              urgencyLevel: request.urgencyLevel,
              hospitalLocation: hospital?.location,
            }
          });
        }
      } catch (err) {
        console.error(`[SOSBroadcastService] Error notifying donor ${donor.donorId}:`, err);
      }
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
