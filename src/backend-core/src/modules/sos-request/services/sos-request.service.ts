import { SOSRequest } from '../models/sos-request.model';
import { SOSEvaluationService } from './sos-evaluation.service';
import { BloodBag } from '../../blood-inventory/models/blood-bag.model';
import { NotificationService } from '../../notification/services/notification.service';
import { AdminAuditLog } from '../../admin/models/audit-log.model';
import { getCompatibleDonorBloodTypes } from '../../../shared/blood-type.utils';
import { Hospital } from '../../auth-account/models/hospital.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { isFeatureEnabled } from '../../admin/services/admin-toggle.service';
import mongoose from 'mongoose';

export class SOSRequestService {
  /** Send completion thanks only to Donors and contributing Blood Centers. */
  private static async notifySOSCompletion(sosRequest: any): Promise<void> {
    const sosRequestId = sosRequest._id.toString();
    const donorIds = Array.from(new Set([
      ...(sosRequest.acceptedDonorIds || []).map((id: any) => id?.toString()),
      ...(sosRequest.directDonations || []).map((donation: any) => donation.donorId?.toString()),
    ].filter(Boolean))) as string[];

    if (donorIds.length > 0) {
      try {
        await NotificationService.sendNotification({
          recipientIds: donorIds,
          type: 'SOS',
          title: '❤️ Ca SOS đã hoàn tất — cảm ơn bạn!',
          body: `Ca cấp cứu SOS nhóm máu ${sosRequest.bloodType} đã nhận đủ ${sosRequest.receivedQuantityMl || sosRequest.requiredQuantityMl}ml máu. Cảm ơn bạn đã hiến máu hoặc sẵn sàng hỗ trợ người bệnh!`,
          payload: {
            sosRequestId,
            status: 'Fulfilled',
            receivedQuantityMl: sosRequest.receivedQuantityMl || 0,
            requiredQuantityMl: sosRequest.requiredQuantityMl,
            deepLink: `/sos-alerts/${sosRequestId}`,
            audienceRole: 'Donor',
            notificationKind: 'SOS_DONOR_COMPLETION_THANK_YOU',
            sourceRefId: sosRequestId,
            sourceRefType: 'SOSRequest',
          },
          channels: ['InApp', 'WebPush', 'Email'],
          allowedRecipientRoles: ['Donor'],
        });
      } catch (error) {
        console.warn('[SOSRequestService] Donor completion notification warning:', error);
      }
    }

    const shipments = (sosRequest.shipments || []).filter((shipment: any) => shipment.status !== 'Cancelled');
    const bloodCenterIds = Array.from(new Set(
      shipments.map((shipment: any) => shipment.bloodCenterId?.toString()).filter(Boolean)
    )) as string[];
    const bloodCenterStaffIds = new Set<string>(
      shipments.map((shipment: any) => shipment.dispatchedByStaffId?.toString()).filter(Boolean)
    );

    if (bloodCenterIds.length > 0) {
      try {
        const { User } = await import('../../auth-account/models/user.model');
        const centerStaff = await User.find({
          role: 'BloodCenterStaff',
          bloodCenterId: { $in: bloodCenterIds },
          accountStatus: 'Active',
          isDeleted: { $ne: true },
        }).select('_id').lean();
        centerStaff.forEach((staff: any) => bloodCenterStaffIds.add(staff._id.toString()));
      } catch (error) {
        console.warn('[SOSRequestService] Could not expand Blood Center completion recipients:', error);
      }
    }

    if (bloodCenterStaffIds.size > 0) {
      try {
        await NotificationService.sendNotification({
          recipientIds: Array.from(bloodCenterStaffIds),
          type: 'SOS',
          title: '✅ Ca SOS đã hoàn tất — cảm ơn Trung tâm máu!',
          body: `Bệnh viện đã nhận đủ ${sosRequest.receivedQuantityMl || sosRequest.requiredQuantityMl}/${sosRequest.requiredQuantityMl}ml máu ${sosRequest.bloodType}. Cảm ơn Trung tâm máu đã phối hợp vận chuyển và hỗ trợ người bệnh kịp thời!`,
          payload: {
            sosRequestId,
            status: 'Fulfilled',
            receivedQuantityMl: sosRequest.receivedQuantityMl || 0,
            requiredQuantityMl: sosRequest.requiredQuantityMl,
            deepLink: `/bc/sos-requests/${sosRequestId}`,
            audienceRole: 'BloodCenterStaff',
            notificationKind: 'SOS_BLOOD_CENTER_COMPLETION_THANK_YOU',
            sourceRefId: sosRequestId,
            sourceRefType: 'SOSRequest',
          },
          channels: ['InApp', 'WebPush', 'Email'],
          allowedRecipientRoles: ['BloodCenterStaff'],
        });
      } catch (error) {
        console.warn('[SOSRequestService] Blood Center completion notification warning:', error);
      }
    }
  }

  public static async createSOSRequest(data: any, createdByStaffId: string, hospitalId: string) {
    if (!hospitalId || !mongoose.Types.ObjectId.isValid(hospitalId)) {
      throw new Error(`Mã bệnh viện (hospitalId: '${hospitalId}') không hợp lệ.`);
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      throw new Error(`Bệnh viện với ID '${hospitalId}' không tồn tại trong hệ thống. Vui lòng chọn bệnh viện hợp lệ.`);
    }

    if (!hospital.location || !Array.isArray(hospital.location.coordinates) || hospital.location.coordinates.length !== 2) {
      throw new Error(`Bệnh viện '${hospital.name}' chưa được thiết lập tọa độ GPS hợp lệ. Không thể tạo yêu cầu SOS.`);
    }

    const request = new SOSRequest({
      ...data,
      createdByStaffId,
      hospitalId,
      status: 'Pending'
    });
    await request.save();

    try {
      await AdminAuditLog.create({
        actorUserId: createdByStaffId,
        actorName: 'Hospital Staff',
        action: 'Create SOS Request',
        actionCategory: 'SOS Request',
        resourceType: 'SOSRequest',
        resourceId: request._id.toString(),
        newValue: {
          hospitalId,
          bloodType: data.bloodType,
          requiredQuantityMl: data.requiredQuantityMl,
          urgencyLevel: data.urgencyLevel,
          fulfillmentDeadline: data.fulfillmentDeadline,
          patientReference: data.patientReference
        },
        details: `Created ${data.urgencyLevel || 'Standard'} SOS Request for ${data.requiredQuantityMl}ml of ${data.bloodType} blood`,
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[SOSRequestService] AuditLog warning:', auditErr);
    }

    // Queue evaluation in BullMQ (High Priority)
    // This decoupled approach allows fast HTTP response while complex evaluation happens async
    try {
      const { sosEvaluationQueue } = await import('../../../config/queue.config');
      await sosEvaluationQueue.add('evaluate-sos', {
        sosRequestId: request._id.toString(),
        expandRadius: false
      }, {
        priority: data.urgencyLevel === 'Critical' ? 1 : 2
      });
    } catch (err: any) {
      console.error(`[SOSRequestService] Auto-evaluation failed for ${request._id}:`, err);
      request.status = 'EvaluationFailed';
      await request.save();
    }

    return request;
  }

  public static async getSOSRequests(filters: any) {
    const { hospitalId, page = 1, limit = 10, status, urgencyLevel, bloodType, search } = filters;
    
    const query: any = {};
    if (hospitalId) query.hospitalId = hospitalId;
    if (status) query.status = status;
    if (urgencyLevel) query.urgencyLevel = urgencyLevel;
    if (bloodType) query.bloodType = bloodType;

    const normalizedSearch = typeof search === 'string' ? search.trim() : '';
    if (normalizedSearch) {
      const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      const searchConditions: any[] = [
        { patientReference: searchRegex },
        { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: escapedSearch, options: 'i' } } },
      ];
      query.$or = searchConditions;
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [data, total] = await Promise.all([
      SOSRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('hospitalId'),
      SOSRequest.countDocuments(query)
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    };
  }

  public static async getSOSRequestById(id: string) {
    const request = await SOSRequest.findById(id).populate('hospitalId');
    if (!request) throw new Error('SOS Request not found');
    return request;
  }

  public static async updateSOSRequestStatus(id: string, status: string, hospitalId?: string) {
    const request = hospitalId ? await SOSRequest.findOne({ _id: id, hospitalId }) : await SOSRequest.findById(id);
    if (!request) throw new Error('SOS Request not found');
    
    const previousStatus = request.status;
    request.status = status as any;
    await request.save();

    if (previousStatus !== 'Fulfilled' && status === 'Fulfilled') {
      await this.notifySOSCompletion(request);
    }

    try {
      await AdminAuditLog.create({
        actorUserId: 'System/Staff',
        actorName: 'Staff',
        action: 'Update SOS Status',
        actionCategory: 'SOS Request',
        resourceType: 'SOSRequest',
        resourceId: id,
        previousValue: { status: previousStatus },
        newValue: { status },
        details: `Updated SOS request status from ${previousStatus} to ${status}`,
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[SOSRequestService] AuditLog warning:', auditErr);
    }

    return request;
  }

  public static async recordDonorResponse(sosRequestId: string, donorId: string, response: 'accepted' | 'declined') {
    const responseTime = new Date();
    if (response === 'declined') {
      const request = await SOSRequest.findById(sosRequestId).select('status fulfillmentDeadline').lean();
      if (!request) {
        const error = new Error('SOS Request not found');
        (error as any).statusCode = 404;
        throw error;
      }
      if (!['Pending', 'EvaluationInProgress', 'NotificationsDispatched'].includes(request.status) || request.fulfillmentDeadline <= responseTime) {
        const error = new Error('Yêu cầu SOS này đã kết thúc hoặc hết hạn, không thể phản hồi thêm.');
        (error as any).statusCode = 409;
        (error as any).code = 'SOS_NOT_ACTIVE';
        throw error;
      }
      return { success: true, status: 'declined', message: 'Response recorded successfully' };
    }

    // 1. Eligibility Check (Medical interval & Age dynamically configured by Admin in SystemConfig)
    const { SystemConfig } = await import('../../admin/models/system-config.model');
    const configs = await SystemConfig.find({ 
      key: { $in: ['donationIntervalDays', 'minDonorAge', 'maxDonorAge'] } 
    }).lean();

    const configMap: Record<string, number> = {
      donationIntervalDays: 84,
      minDonorAge: 18,
      maxDonorAge: 60
    };
    for (const c of configs) {
      if (typeof c.value === 'number') configMap[c.key] = c.value;
    }

    const donorProfile = await DonorProfile.findOne({
      $or: [
        { userId: mongoose.Types.ObjectId.isValid(donorId) ? new mongoose.Types.ObjectId(donorId) : donorId },
        { _id: mongoose.Types.ObjectId.isValid(donorId) ? new mongoose.Types.ObjectId(donorId) : donorId }
      ]
    });

    if (donorProfile) {
      // Check lastDonationDate (interval days configured by Admin)
      const requiredInterval = configMap.donationIntervalDays;
      if (donorProfile.lastDonationDate) {
        const diffMs = Date.now() - new Date(donorProfile.lastDonationDate).getTime();
        const daysSinceLast = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (daysSinceLast >= 0 && daysSinceLast < requiredInterval) {
          const daysRemaining = requiredInterval - daysSinceLast;
          const error = new Error(`Cảm ơn bạn, nhưng bạn cần đợi thêm ${daysRemaining} ngày nữa (khoảng cách an toàn ${requiredInterval} ngày giữa 2 lần hiến máu) để đảm bảo sức khỏe.`);
          (error as any).statusCode = 400;
          throw error;
        }
      }

      // Check age (min/max age configured by Admin)
      if (donorProfile.dateOfBirth) {
        const age = Math.floor((Date.now() - new Date(donorProfile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        if (age < configMap.minDonorAge || age > configMap.maxDonorAge) {
          const error = new Error(`Độ tuổi hiến máu quy định theo chuẩn y tế là từ ${configMap.minDonorAge} đến ${configMap.maxDonorAge} tuổi (Hiện tại: ${age} tuổi).`);
          (error as any).statusCode = 400;
          throw error;
        }
      }
    }

    // A donor response is a pledge, not collected or received blood.
    // Keep it separate so a request is only fulfilled after the hospital confirms receipt.
    const request = await SOSRequest.findOneAndUpdate(
      { 
        _id: sosRequestId, 
        status: { $in: ['Pending', 'EvaluationInProgress', 'NotificationsDispatched'] },
        fulfillmentDeadline: { $gt: responseTime },
        acceptedDonorIds: { $ne: donorId }
      },
      { 
        $inc: { pledgedQuantityMl: 250 },
        $addToSet: { acceptedDonorIds: donorId }
      },
      { returnDocument: 'after' }
    );

    if (!request) {
      // Check why it failed
      const existingRequest = await SOSRequest.findById(sosRequestId);
      if (!existingRequest) {
        const error = new Error('SOS Request not found');
        (error as any).statusCode = 404;
        throw error;
      }
      if (existingRequest.acceptedDonorIds.map((id: any) => id.toString()).includes(donorId)) {
        return { success: true, status: 'already_responded', message: 'You have already responded to this request' };
      }
      
      const error = new Error('Yêu cầu SOS này đã kết thúc hoặc hết hạn, không thể phản hồi thêm.');
      (error as any).statusCode = 409;
      (error as any).code = 'SOS_NOT_ACTIVE';
      throw error;
    }

    try {
      await AdminAuditLog.create({
        actorUserId: donorId,
        actorName: donorProfile?.fullName || 'Donor',
        action: 'Respond to SOS Request',
        actionCategory: 'SOS Request',
        resourceType: 'SOSRequest',
        resourceId: sosRequestId,
        newValue: { donorId, pledgedQuantityMl: request.pledgedQuantityMl, status: request.status },
        details: `Donor pledged to emergency blood request ${sosRequestId}; reward is deferred until the donation is received`,
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[SOSRequestService] AuditLog warning:', auditErr);
    }

    return { 
      success: true, 
      status: 'accepted', 
      message: 'Đã ghi nhận cam kết hỗ trợ. Điểm thưởng chỉ được cộng sau khi bệnh viện tiếp nhận máu.',
      pledgedQuantityMl: request.pledgedQuantityMl
    };
  }
  public static async reopenSOSRequest(sosRequestId: string, cancelledDonorId: string, hospitalId?: string) {
    const request = hospitalId
      ? await SOSRequest.findOne({ _id: sosRequestId, hospitalId })
      : await SOSRequest.findById(sosRequestId);
    if (!request) throw new Error('SOS Request not found');

    // Remove the donor pledge. Never reduce collected/received blood for a cancelled pledge.
    const updatedRequest = await SOSRequest.findOneAndUpdate(
      { _id: sosRequestId, acceptedDonorIds: cancelledDonorId },
      {
        $pull: { acceptedDonorIds: cancelledDonorId },
        $inc: { pledgedQuantityMl: -250 }
      },
      { returnDocument: 'after' }
    );

    if (!updatedRequest) {
      throw new Error('Donor was not found in the accepted list for this SOS request');
    }

    if (updatedRequest.pledgedQuantityMl < 0) {
      updatedRequest.pledgedQuantityMl = 0;
    }

    // Re-evaluate only active, unexpired requests.
    if (updatedRequest.fulfillmentDeadline > new Date() && ['Pending', 'NotificationsDispatched', 'EvaluationInProgress'].includes(updatedRequest.status)) {
      updatedRequest.status = 'EvaluationInProgress';
      await updatedRequest.save();

      // Trigger the broadcast service to find more people!
      // Dynamically import to avoid circular dependency if any
      const { SOSBroadcastService } = await import('./sos-broadcast.service');
      // Fire and forget
      SOSBroadcastService.broadcastAlert(sosRequestId).catch(err => {
        console.error(`[SOSRequestService] Error re-broadcasting SOS ${sosRequestId}:`, err);
      });
    }

    try {
      await AdminAuditLog.create({
        actorUserId: cancelledDonorId,
        actorName: 'Donor/System',
        action: 'Reopen SOS Request',
        actionCategory: 'SOS Request',
        resourceType: 'SOSRequest',
        resourceId: sosRequestId,
        previousValue: { status: request.status },
        newValue: { status: updatedRequest.status, pledgedQuantityMl: updatedRequest.pledgedQuantityMl },
        details: `Reopened SOS request due to cancellation by donor ${cancelledDonorId}`,
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[SOSRequestService] AuditLog warning:', auditErr);
    }

    return { 
      success: true, 
      message: 'SOS Request reopened successfully', 
      pledgedQuantityMl: updatedRequest.pledgedQuantityMl,
      status: updatedRequest.status
    };
  }

  public static async fulfillFromInventory(sosRequestId: string, bagIds: string[], staffId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Get SOS Request
      const sosRequest = await SOSRequest.findById(sosRequestId).session(session);
      if (!sosRequest) {
        const error = new Error('SOS Request not found');
        (error as any).statusCode = 404;
        throw error;
      }
      
      if (sosRequest.status === 'Fulfilled') {
        const error = new Error('SOS Request is already fulfilled');
        (error as any).statusCode = 400;
        throw error;
      }

      if (!['Pending', 'EvaluationInProgress', 'NotificationsDispatched'].includes(sosRequest.status)) {
        const error = new Error(`Cannot fulfill SOS Request with status: ${sosRequest.status}`);
        (error as any).statusCode = 400;
        throw error;
      }

      // Check staff authorization and blood center match
      const staffUser = await (await import('../../auth-account/models/user.model')).User.findById(staffId).select('bloodCenterId role').lean();
      if (!staffUser || staffUser.role !== 'BloodCenterStaff' || !staffUser.bloodCenterId) {
        const error = new Error('Unauthorized or blood center not assigned to staff');
        (error as any).statusCode = 403;
        throw error;
      }

      // 2. Fetch blood bags and verify
      const bags = await BloodBag.find({ 
        _id: { $in: bagIds },
        status: 'Available'
      }).session(session);

      if (bags.length !== bagIds.length) {
        const error = new Error('One or more blood bags are not available or do not exist');
        (error as any).statusCode = 400;
        throw error;
      }

      // Verify all bags belong to the staff's blood center
      const staffCenterIdStr = staffUser.bloodCenterId.toString();
      for (const bag of bags) {
        if (!bag.bloodCenterId || bag.bloodCenterId.toString() !== staffCenterIdStr) {
          const error = new Error(`Blood bag ${bag.bagCode} does not belong to your blood center`);
          (error as any).statusCode = 403;
          throw error;
        }
      }

      // Check all bags are Available
      const unavailableBags = bags.filter(b => b.status !== 'Available');
      if (unavailableBags.length > 0) {
        throw new Error(`${unavailableBags.length} bag(s) are not available for use (current status: ${unavailableBags.map(b => b.status).join(', ')})`);
      }

      // Check blood type matches (support cross-transfusion)
      const compatibleTypes = getCompatibleDonorBloodTypes(sosRequest.bloodType);
      const wrongTypeBags = bags.filter(b => !compatibleTypes.includes(b.bloodType));
      if (wrongTypeBags.length > 0) {
        throw new Error(`Blood type mismatch: SOS requires ${sosRequest.bloodType} (Compatible: ${compatibleTypes.join(', ')}), but ${wrongTypeBags.length} bag(s) are ${wrongTypeBags.map(b => b.bloodType).join(', ')}`);
      }

      // 3. Calculate total volume and verify against remaining needed (prevent over-fulfillment)
      const totalVolumeMl = bags.reduce((sum, bag) => sum + (bag.volumeMl || 0), 0);
      
      if (totalVolumeMl <= 0) {
        throw new Error('Total volume of selected bags is 0');
      }

      const currentReceived = sosRequest.receivedQuantityMl ?? 0;
      const currentInTransit = sosRequest.inTransitQuantityMl || 0;
      const remainingNeeded = Math.max(0, sosRequest.requiredQuantityMl - currentReceived - currentInTransit);

      if (totalVolumeMl > remainingNeeded) {
        throw new Error(`Không thể xuất kho vượt quá lượng máu cần bổ sung (${remainingNeeded}ml). Hiện tại Bệnh viện đã nhận ${currentReceived}ml và có ${currentInTransit}ml đang trên đường vận chuyển.`);
      }

      // 4. Update blood bags to "Used" status
      const now = new Date();
      for (const bag of bags) {
        bag.status = 'Used';
        bag.statusHistory.unshift({
          previousStatus: 'Available',
          newStatus: 'Used',
          changedBy: staffId,
          changedAt: now,
          reason: `Fulfilled SOS Request ${sosRequestId}`
        });
        await bag.save({ session });
      }

      // 5. Create Shipment & Update SOS Request in-transit volume
      const center = await (await import('../../auth-account/models/blood-center.model')).BloodCenter.findById(staffUser.bloodCenterId).lean();
      const shipmentCode = `SHIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      if (!sosRequest.shipments) sosRequest.shipments = [];
      sosRequest.shipments.push({
        shipmentCode,
        bloodCenterId: staffUser.bloodCenterId,
        bloodCenterName: center?.name || 'Trung tâm hiến máu',
        dispatchedByStaffId: new mongoose.Types.ObjectId(staffId),
        dispatchedStaffName: (staffUser as any).fullName || 'Cán bộ Trung tâm máu',
        bloodBagIds: bagIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        volumeMl: totalVolumeMl,
        bloodType: sosRequest.bloodType,
        dispatchedAt: now,
        status: 'InTransit'
      });

      sosRequest.inTransitQuantityMl = (sosRequest.inTransitQuantityMl || 0) + totalVolumeMl;
      sosRequest.collectedQuantityMl = (sosRequest.collectedQuantityMl || 0) + totalVolumeMl;
      sosRequest.status = 'InventoryDispatched';
      sosRequest.fulfilledByStaffId = new mongoose.Types.ObjectId(staffId) as any;
      
      await sosRequest.save({ session });

      await session.commitTransaction();
      session.endSession();

      try {
        await AdminAuditLog.create({
          actorUserId: staffId,
          actorName: 'Blood Center Staff',
          action: 'Fulfill SOS Request from Inventory',
          actionCategory: 'SOS Request',
          resourceType: 'SOSRequest',
          resourceId: sosRequestId,
          previousValue: { inTransitQuantityMl: currentInTransit },
          newValue: { inTransitQuantityMl: sosRequest.inTransitQuantityMl, status: sosRequest.status, bagsUsed: bags.length },
          details: `Dispatched shipment ${shipmentCode} with ${totalVolumeMl}ml from ${bags.length} blood bag(s)`,
          status: 'Success'
        });
      } catch (auditErr) {
        console.warn('[SOSRequestService] AuditLog warning:', auditErr);
      }

      // Collect recipient ID: hospital staff only (who created the SOS request)
      const recipientIds = [sosRequest.createdByStaffId.toString()];

      // Send notification to hospital staff and accepted donors
      try {
        await NotificationService.sendNotification({
          recipientIds,
          type: 'SOS',
          title: '📦 Máu từ kho đang được vận chuyển đến bệnh viện',
          body: `Trung tâm ${center?.name || 'máu'} đã xuất ${totalVolumeMl}ml máu (Mã: ${shipmentCode}) cho yêu cầu SOS ${sosRequest._id}. Vui lòng kiểm tra và xác nhận khi nhận được máu.`,
          payload: {
            sosRequestId: sosRequest._id.toString(),
            shipmentCode,
            bloodType: sosRequest.bloodType,
            totalVolumeMl,
            inTransitQuantityMl: sosRequest.inTransitQuantityMl,
            requiredQuantityMl: sosRequest.requiredQuantityMl,
            status: sosRequest.status,
            fulfilledBy: staffId,
            bagsUsed: bags.length,
            fulfilledByInventory: true,
            deepLink: `/hospital/sos-requests/${sosRequest._id.toString()}`
          },
          channels: ['WebPush', 'Email', 'InApp'] as any,
          priority: 'high',
          allowedRecipientRoles: ['HospitalStaff']
        });
      } catch (notifError) {
        console.error('[SOSRequestService] Failed to send fulfillment notification:', notifError);
      }

      return {
        success: true,
        message: `Xuất kho thành công ${bags.length} túi máu (${totalVolumeMl}ml). Mã vận đơn: ${shipmentCode}`,
        data: {
          sosRequestId: sosRequest._id,
          shipmentCode,
          bagsUsed: bags.length,
          totalVolumeMl,
          inTransitQuantityMl: sosRequest.inTransitQuantityMl,
          requiredQuantityMl: sosRequest.requiredQuantityMl,
          status: sosRequest.status
        }
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  public static async hospitalConfirmShipmentReceipt(sosRequestId: string, shipmentId: string, staffId: string) {
    const sosRequest = await SOSRequest.findById(sosRequestId);
    if (!sosRequest) {
      const error = new Error('SOS Request not found');
      (error as any).statusCode = 404;
      throw error;
    }
    await this.assertHospitalOwnership(sosRequest, staffId);
    const previousStatus = sosRequest.status;

    const shipment = sosRequest.shipments.find(s => s._id?.toString() === shipmentId || (s as any).id === shipmentId);
    if (!shipment) {
      const error = new Error('Shipment not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (shipment.status === 'Received') {
      return { success: true, message: 'Đợt máu này đã được xác nhận nhận trước đó', data: sosRequest };
    }

    const now = new Date();
    shipment.status = 'Received';
    shipment.receivedAt = now;
    shipment.receivedByStaffId = new mongoose.Types.ObjectId(staffId) as any;

    sosRequest.inTransitQuantityMl = Math.max(0, (sosRequest.inTransitQuantityMl || 0) - shipment.volumeMl);
    sosRequest.receivedQuantityMl = (sosRequest.receivedQuantityMl || 0) + shipment.volumeMl;

    const isFullyFulfilled = sosRequest.receivedQuantityMl >= sosRequest.requiredQuantityMl;
    if (isFullyFulfilled) {
      sosRequest.status = 'Fulfilled';
    } else if (sosRequest.inTransitQuantityMl > 0) {
      sosRequest.status = 'InventoryDispatched';
    } else {
      sosRequest.status = 'NotificationsDispatched';
    }

    await sosRequest.save();

    const remainingMl = Math.max(0, sosRequest.requiredQuantityMl - sosRequest.receivedQuantityMl);

    try {
      await AdminAuditLog.create({
        actorUserId: staffId,
        actorName: 'Hospital Staff',
        action: 'Confirm Shipment Blood Receipt',
        actionCategory: 'SOS Request',
        resourceType: 'SOSRequest',
        resourceId: sosRequestId,
        newValue: { 
          shipmentCode: shipment.shipmentCode, 
          receivedQuantityMl: sosRequest.receivedQuantityMl, 
          status: sosRequest.status 
        },
        details: `Hospital confirmed receipt for shipment ${shipment.shipmentCode} (${shipment.volumeMl}ml from ${shipment.bloodCenterName || 'Blood Center'})`,
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[SOSRequestService] AuditLog warning:', auditErr);
    }

    // Notify Blood Center Staff who dispatched this shipment
    if (shipment.dispatchedByStaffId) {
      try {
        await NotificationService.sendNotification({
          recipientIds: [shipment.dispatchedByStaffId.toString()],
          type: 'SOS',
          title: isFullyFulfilled ? '✅ Bệnh viện đã nhận máu (Ca SOS hoàn tất)' : '📦 Bệnh viện đã nhận đợt máu',
          body: `Bệnh viện đã xác nhận nhận thành công ${shipment.volumeMl}ml máu (Mã: ${shipment.shipmentCode}). Tổng nhận: ${sosRequest.receivedQuantityMl}/${sosRequest.requiredQuantityMl}ml.`,
          payload: {
            sosRequestId,
            shipmentCode: shipment.shipmentCode,
            status: sosRequest.status,
            receivedQuantityMl: sosRequest.receivedQuantityMl,
            requiredQuantityMl: sosRequest.requiredQuantityMl,
            deepLink: `/bc/sos-requests/${sosRequestId}`
          },
          channels: ['WebPush', 'InApp', 'Email'] as any,
          allowedRecipientRoles: ['BloodCenterStaff']
        });
      } catch (bcErr) {
        console.warn('[SOSRequestService] BC notification warning:', bcErr);
      }
    }

    if (previousStatus !== 'Fulfilled' && isFullyFulfilled) {
      await this.notifySOSCompletion(sosRequest);
    }

    return { 
      success: true, 
      status: sosRequest.status, 
      message: `Đã xác nhận nhận đợt máu (${shipment.volumeMl}ml) từ ${shipment.bloodCenterName || 'Trung tâm máu'} thành công!`,
      data: sosRequest 
    };
  }

  public static async hospitalConfirmReceived(sosRequestId: string, staffId: string) {
    const sosRequest = await SOSRequest.findById(sosRequestId);
    if (!sosRequest) {
      const error = new Error('SOS Request not found');
      (error as any).statusCode = 404;
      throw error;
    }
    await this.assertHospitalOwnership(sosRequest, staffId);
    const previousStatus = sosRequest.status;

    // Confirm all pending in-transit shipments
    const now = new Date();
    if (sosRequest.shipments && sosRequest.shipments.length > 0) {
      for (const s of sosRequest.shipments) {
        if (s.status === 'InTransit') {
          s.status = 'Received';
          s.receivedAt = now;
          s.receivedByStaffId = new mongoose.Types.ObjectId(staffId) as any;
        }
      }
    }

    sosRequest.receivedQuantityMl = (sosRequest.receivedQuantityMl || 0) + (sosRequest.inTransitQuantityMl || 0);
    sosRequest.inTransitQuantityMl = 0;

    const isFullyFulfilled = sosRequest.receivedQuantityMl >= sosRequest.requiredQuantityMl;
    sosRequest.status = isFullyFulfilled ? 'Fulfilled' : 'NotificationsDispatched';
    await sosRequest.save();

    if (previousStatus !== 'Fulfilled' && isFullyFulfilled) {
      await this.notifySOSCompletion(sosRequest);
    }

    return { 
      success: true, 
      status: sosRequest.status, 
      message: isFullyFulfilled ? 'Đã xác nhận nhận đủ máu! Ca SOS hoàn tất.' : `Đã xác nhận nhận các đợt máu (${sosRequest.receivedQuantityMl}/${sosRequest.requiredQuantityMl}ml).`,
      data: sosRequest 
    };
  }

  public static async recordDirectDonation(sosRequestId: string, staffId: string, payload: {
    volumeMl: number;
    fastTrackCode?: string;
    donorId?: string;
    donorName: string;
    idDocumentNumber?: string;
    donorPhone?: string;
    bloodType?: string;
    note?: string;
  }) {
    const sosRequest = await SOSRequest.findById(sosRequestId);
    if (!sosRequest) {
      const error = new Error('SOS Request not found');
      (error as any).statusCode = 404;
      throw error;
    }
    await this.assertHospitalOwnership(sosRequest, staffId);
    const previousStatus = sosRequest.status;

    if (['Cancelled', 'Expired', 'Fulfilled'].includes(sosRequest.status)) {
      const error = new Error(`Không thể ghi nhận hiến máu cho ca SOS có trạng thái: ${sosRequest.status}`);
      (error as any).statusCode = 400;
      throw error;
    }

    if (sosRequest.fulfillmentDeadline <= new Date()) {
      sosRequest.status = 'Expired';
      await sosRequest.save();
      const error = new Error('Yêu cầu SOS đã hết hạn. Không thể ghi nhận lượt hiến mới.');
      (error as any).statusCode = 409;
      (error as any).code = 'SOS_NOT_ACTIVE';
      throw error;
    }

    const currentReceived = sosRequest.receivedQuantityMl || 0;
    const currentInTransit = sosRequest.inTransitQuantityMl || 0;
    const remainingNeeded = Math.max(0, sosRequest.requiredQuantityMl - currentReceived - currentInTransit);
    if (payload.volumeMl > remainingNeeded) {
      const error = new Error(`Thể tích ghi nhận vượt quá lượng còn thiếu (${remainingNeeded}ml, đã nhận ${currentReceived}ml và đang vận chuyển ${currentInTransit}ml).`);
      (error as any).statusCode = 400;
      throw error;
    }

    const now = new Date();
    let donorObjId: mongoose.Types.ObjectId | undefined;

    // 1. If fastTrackCode or donorId provided, find and update Donor Profile
    let donorProfile: any = null;
    if (payload.donorId && mongoose.Types.ObjectId.isValid(payload.donorId)) {
      donorObjId = new mongoose.Types.ObjectId(payload.donorId);
      donorProfile = await DonorProfile.findOne({ userId: donorObjId });
    } else if (payload.idDocumentNumber) {
      donorProfile = await DonorProfile.findOne({ idDocumentNumber: payload.idDocumentNumber });
      if (donorProfile) donorObjId = donorProfile.userId;
    } else if (payload.fastTrackCode) {
      // Find notification matching fastTrackCode or search by donor
      const notifs = await (await import('../../notification/models/Notification')).Notification.find({
        sourceRefId: sosRequest._id,
        type: 'SOS'
      }).lean();
      for (const n of notifs) {
        const code = `SOS-${(n._id.toString()).slice(-6).toUpperCase()}`;
        if (code.toLowerCase() === payload.fastTrackCode.toLowerCase().trim()) {
          donorObjId = n.recipientUserId as any;
          donorProfile = await DonorProfile.findOne({ userId: donorObjId });
          break;
        }
      }
    }

    const donationBloodType = payload.bloodType || donorProfile?.bloodType || sosRequest.bloodType;
    const compatibleTypes = getCompatibleDonorBloodTypes(sosRequest.bloodType);
    if (donationBloodType && !compatibleTypes.includes(donationBloodType)) {
      const error = new Error(`Nhóm máu ${donationBloodType} không tương thích với người nhận nhóm ${sosRequest.bloodType}.`);
      (error as any).statusCode = 400;
      throw error;
    }
    const alreadyRecorded = (sosRequest.directDonations || []).some((donation) =>
      (donorObjId && donation.donorId?.toString() === donorObjId.toString()) ||
      (payload.fastTrackCode && donation.fastTrackCode?.toLowerCase() === payload.fastTrackCode.toLowerCase())
    );
    if (alreadyRecorded) {
      const error = new Error('Lượt hiến máu này đã được ghi nhận trước đó.');
      (error as any).statusCode = 409;
      throw error;
    }

    // 2. Medical donation history is always updated; XP and badges respect the Admin toggle.
    const gamificationEnabled = await isFeatureEnabled('gamification_badges');
    if (donorProfile) {
      donorProfile.lastDonationDate = now;
      donorProfile.totalDonations = (donorProfile.totalDonations || 0) + 1;

      if (gamificationEnabled) {
        donorProfile.xp = (donorProfile.xp || 0) + 150;
        donorProfile.donorLevel = Math.max(1, Math.floor(donorProfile.xp / 500) + 1);
        if (!donorProfile.achievements) donorProfile.achievements = [];
        const hasHeroBadge = donorProfile.achievements.some((a: any) => a.badgeType === 'SOS_HERO');
        if (!hasHeroBadge) {
          donorProfile.achievements.push({
            badgeType: 'SOS_HERO',
            title: 'Hiệp Sĩ Cứu Người (SOS Hero)',
            description: 'Đã sẵn sàng tham gia hiến máu trong ca cấp cứu khẩn cấp',
            icon: '🛡️',
            awardedAt: now
          });
        }
      }
      await donorProfile.save();
    }

    // 3. Add to direct donations list
    if (!sosRequest.directDonations) sosRequest.directDonations = [];
    sosRequest.directDonations.push({
      donorId: donorObjId,
      donorName: payload.donorName || donorProfile?.fullName || 'Người hiến máu trực tiếp',
      idDocumentNumber: payload.idDocumentNumber || donorProfile?.idDocumentNumber,
      donorPhone: payload.donorPhone || donorProfile?.phoneNumber,
      bloodType: donationBloodType,
      fastTrackCode: payload.fastTrackCode,
      volumeMl: payload.volumeMl,
      recordedAt: now,
      recordedByStaffId: new mongoose.Types.ObjectId(staffId),
      note: payload.note
    });

    if (donorObjId && !sosRequest.acceptedDonorIds.some(id => id.toString() === donorObjId!.toString())) {
      sosRequest.acceptedDonorIds.push(donorObjId);
    }

    // Direct donations are collected and received at the hospital in the same action.
    sosRequest.collectedQuantityMl = (sosRequest.collectedQuantityMl || 0) + payload.volumeMl;
    sosRequest.receivedQuantityMl = (sosRequest.receivedQuantityMl || 0) + payload.volumeMl;

    const isFullyFulfilled = sosRequest.receivedQuantityMl >= sosRequest.requiredQuantityMl;
    if (isFullyFulfilled) {
      sosRequest.status = 'Fulfilled';
    }

    await sosRequest.save();

    try {
      await AdminAuditLog.create({
        actorUserId: staffId,
        actorName: 'Hospital Staff',
        action: 'Record Direct Blood Donation',
        actionCategory: 'SOS Request',
        resourceType: 'SOSRequest',
        resourceId: sosRequestId,
        newValue: { 
          donorName: payload.donorName,
          volumeMl: payload.volumeMl, 
          receivedQuantityMl: sosRequest.receivedQuantityMl, 
          status: sosRequest.status 
        },
        details: `Hospital recorded direct donation of ${payload.volumeMl}ml from ${payload.donorName} (${payload.fastTrackCode || 'Walk-in'})`,
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[SOSRequestService] AuditLog warning:', auditErr);
    }

    // Send thank you notification to donor if account exists
    if (donorObjId) {
      try {
        await NotificationService.sendNotification({
          recipientIds: [donorObjId.toString()],
          type: 'SOS',
          title: '🎉 Tiếp nhận hiến máu cấp cứu thành công!',
          body: gamificationEnabled
            ? `Bệnh viện đã tiếp nhận thành công ${payload.volumeMl}ml máu từ bạn cho ca cấp cứu SOS. Bạn nhận được +150 XP và huy hiệu Hiệp Sĩ Cứu Người!`
            : `Bệnh viện đã tiếp nhận thành công ${payload.volumeMl}ml máu từ bạn cho ca cấp cứu SOS. Cảm ơn bạn đã góp phần cứu người!`,
          payload: {
            sosRequestId,
            volumeMl: payload.volumeMl,
            status: sosRequest.status,
            deepLink: `/donor/my-profile`,
            audienceRole: 'Donor',
            notificationKind: 'SOS_DONOR_THANK_YOU',
            sourceRefId: sosRequestId,
            sourceRefType: 'SOSRequest'
          },
          channels: ['InApp', 'WebPush', 'Email'] as any,
          allowedRecipientRoles: ['Donor']
        });
      } catch (dErr) {
        console.warn('[SOSRequestService] Donor notification warning:', dErr);
      }
    }

    if (previousStatus !== 'Fulfilled' && isFullyFulfilled) {
      await this.notifySOSCompletion(sosRequest);
    }

    return {
      success: true,
      message: `Đã tiếp nhận ${payload.volumeMl}ml máu từ người hiến ${payload.donorName} thành công!`,
      data: sosRequest
    };
  }

  public static async lookupDonorForSOS(sosRequestId: string, queryStr: string, staffId: string) {
    const sosRequest = await SOSRequest.findById(sosRequestId);
    if (!sosRequest) {
      const error = new Error('SOS Request not found');
      (error as any).statusCode = 404;
      throw error;
    }
    await this.assertHospitalOwnership(sosRequest, staffId);
    if (!queryStr || !queryStr.trim()) {
      return { success: false, message: 'Query is required', data: [] };
    }

    const q = queryStr.trim();
    const cleanCode = q.toUpperCase();

    // 1. Search in SOS notifications for this SOS request (by Fast Track Code)
    const { Notification } = await import('../../notification/models/Notification');
    const notifs = await Notification.find({
      sourceRefId: new mongoose.Types.ObjectId(sosRequestId),
      type: 'SOS'
    }).lean();

    for (const n of notifs) {
      const code = `SOS-${(n._id.toString()).slice(-6).toUpperCase()}`;
      if (code === cleanCode || (n._id.toString()).slice(-6).toUpperCase() === cleanCode.replace('SOS-', '')) {
        const profile = await DonorProfile.findOne({ userId: n.recipientUserId }).lean();
        return {
          success: true,
          data: [{
            donorId: n.recipientUserId?.toString(),
            fullName: profile?.fullName || 'Người hiến máu',
            idDocumentNumber: profile?.idDocumentNumber || 'N/A',
            phoneNumber: profile?.phoneNumber || 'N/A',
            bloodType: profile?.bloodType || 'Unknown',
            fastTrackCode: code,
            donorResponse: (n.payload as any)?.donorResponse || 'accepted'
          }]
        };
      }
    }

    // 2. Search in DonorProfile by CCCD, Phone, or FullName
    const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const profiles = await DonorProfile.find({
      $or: [
        { idDocumentNumber: searchRegex },
        { phoneNumber: searchRegex },
        { fullName: searchRegex }
      ]
    }).limit(10).lean();

    return {
      success: true,
      data: profiles.map(p => ({
        donorId: p.userId?.toString(),
        fullName: p.fullName,
        idDocumentNumber: p.idDocumentNumber,
        phoneNumber: p.phoneNumber,
        bloodType: p.bloodType,
        fastTrackCode: `SOS-${(p.userId?.toString() || '').slice(-6).toUpperCase()}`
      }))
    };
  }

  private static async assertHospitalOwnership(sosRequest: any, staffId: string) {
    const { User } = await import('../../auth-account/models/user.model');
    const staff = await User.findById(staffId).select('role roles hospitalId').lean();
    const roles = new Set([staff?.role, ...(Array.isArray(staff?.roles) ? staff.roles : [])]);
    if (!staff || !roles.has('HospitalStaff') || !staff.hospitalId || staff.hospitalId.toString() !== sosRequest.hospitalId.toString()) {
      const error = new Error('Bạn không có quyền thao tác yêu cầu SOS của bệnh viện khác.');
      (error as any).statusCode = 403;
      throw error;
    }
  }
}

