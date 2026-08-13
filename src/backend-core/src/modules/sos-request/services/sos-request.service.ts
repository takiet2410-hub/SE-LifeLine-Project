import { SOSRequest } from '../models/sos-request.model';
import { SOSEvaluationService } from './sos-evaluation.service';
import { BloodBag } from '../../blood-inventory/models/blood-bag.model';
import { NotificationService } from '../../notification/services/notification.service';
import { AdminAuditLog } from '../../admin/models/audit-log.model';
import mongoose from 'mongoose';

export class SOSRequestService {
  public static async createSOSRequest(data: any, createdByStaffId: string, hospitalId: string) {
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
      throw new Error(`Auto-evaluation failed: ${err.message}`);
    }

    return request;
  }

  public static async getSOSRequests(filters: any) {
    const { hospitalId, page = 1, limit = 10, status, urgencyLevel } = filters;
    
    const query: any = {};
    if (hospitalId) query.hospitalId = hospitalId;
    if (status) query.status = status;
    if (urgencyLevel) query.urgencyLevel = urgencyLevel;

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

  public static async updateSOSRequestStatus(id: string, status: string) {
    const request = await SOSRequest.findById(id);
    if (!request) throw new Error('SOS Request not found');
    
    const previousStatus = request.status;
    request.status = status as any;
    await request.save();

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
    if (response === 'declined') {
      return { success: true, status: 'declined', message: 'Response recorded successfully' };
    }

    // Atomic update to handle concurrency and double counting
    const request = await SOSRequest.findOneAndUpdate(
      { 
        _id: sosRequestId, 
        status: { $in: ['Pending', 'EvaluationInProgress', 'NotificationsDispatched'] },
        acceptedDonorIds: { $ne: donorId }
      },
      { 
        $inc: { collectedQuantityMl: 250 },
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
      
      return { success: true, status: 'fulfilled_or_expired', message: 'SOS Request is no longer active' };
    }

    try {
      await AdminAuditLog.create({
        actorUserId: donorId,
        actorName: 'Donor',
        action: 'Respond to SOS Request',
        actionCategory: 'SOS Request',
        resourceType: 'SOSRequest',
        resourceId: sosRequestId,
        newValue: { donorId, collectedQuantityMl: request.collectedQuantityMl, status: request.status },
        details: `Donor accepted emergency blood request ${sosRequestId}`,
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[SOSRequestService] AuditLog warning:', auditErr);
    }

    // If collected quantity reaches required quantity, mark as Fulfilled
    if (request.collectedQuantityMl >= request.requiredQuantityMl) {
      request.status = 'Fulfilled';
      await request.save();
    }

    return { success: true, status: 'accepted', message: 'Response recorded successfully' };
  }
  public static async reopenSOSRequest(sosRequestId: string, cancelledDonorId: string) {
    const request = await SOSRequest.findById(sosRequestId);
    if (!request) throw new Error('SOS Request not found');

    // Remove the donor and decrement quantity
    const updatedRequest = await SOSRequest.findOneAndUpdate(
      { _id: sosRequestId, acceptedDonorIds: cancelledDonorId },
      {
        $pull: { acceptedDonorIds: cancelledDonorId },
        $inc: { collectedQuantityMl: -250 }
      },
      { returnDocument: 'after' }
    );

    if (!updatedRequest) {
      throw new Error('Donor was not found in the accepted list for this SOS request');
    }

    // Check if we need to revert status
    if (updatedRequest.collectedQuantityMl < updatedRequest.requiredQuantityMl) {
      // It's no longer fulfilled. Set it back to EvaluationInProgress to re-trigger
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
        newValue: { status: updatedRequest.status, collectedQuantityMl: updatedRequest.collectedQuantityMl },
        details: `Reopened SOS request due to cancellation by donor ${cancelledDonorId}`,
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[SOSRequestService] AuditLog warning:', auditErr);
    }

    return { 
      success: true, 
      message: 'SOS Request reopened successfully', 
      collectedQuantityMl: updatedRequest.collectedQuantityMl,
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

      // Check blood type matches
      const wrongTypeBags = bags.filter(b => b.bloodType !== sosRequest.bloodType);
      if (wrongTypeBags.length > 0) {
        throw new Error(`Blood type mismatch: SOS requires ${sosRequest.bloodType}, but ${wrongTypeBags.length} bag(s) are ${wrongTypeBags.map(b => b.bloodType).join(', ')}`);
      }

      // 3. Calculate total volume
      const totalVolumeMl = bags.reduce((sum, bag) => sum + (bag.volumeMl || 0), 0);
      
      if (totalVolumeMl <= 0) {
        throw new Error('Total volume of selected bags is 0');
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

      // 5. Update SOS Request
      const newCollectedQuantity = sosRequest.collectedQuantityMl + totalVolumeMl;
      sosRequest.collectedQuantityMl = newCollectedQuantity;
      
      if (newCollectedQuantity >= sosRequest.requiredQuantityMl) {
        sosRequest.status = 'Fulfilled';
      } else if (sosRequest.status === 'Pending' || sosRequest.status === 'EvaluationInProgress') {
        sosRequest.status = 'NotificationsDispatched';
      }
      
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
          previousValue: { collectedQuantityMl: sosRequest.collectedQuantityMl - totalVolumeMl },
          newValue: { collectedQuantityMl: newCollectedQuantity, status: sosRequest.status, bagsUsed: bags.length },
          details: `Fulfilled ${totalVolumeMl}ml from ${bags.length} blood bag(s)`,
          status: 'Success'
        });
      } catch (auditErr) {
        console.warn('[SOSRequestService] AuditLog warning:', auditErr);
      }

      // Collect all recipient IDs: hospital staff + accepted donors
      const recipientIds = [sosRequest.createdByStaffId.toString()];
      
      // Add accepted donors if any
      if (sosRequest.acceptedDonorIds && sosRequest.acceptedDonorIds.length > 0) {
        recipientIds.push(...sosRequest.acceptedDonorIds.map(id => id.toString()));
      }

      // Send notification to hospital staff and accepted donors
      try {
        await NotificationService.sendNotification({
          recipientIds,
          type: 'SOS',
          title: 'Yêu cầu cấp cứu máu đã được đáp ứng',
          body: `Yêu cầu SOS ${sosRequest._id} (${sosRequest.bloodType}) đã được cung cấp ${totalVolumeMl}ml máu từ kho.`,
          payload: {
            sosRequestId: sosRequest._id.toString(),
            bloodType: sosRequest.bloodType,
            totalVolumeMl,
            newCollectedQuantityMl: newCollectedQuantity,
            requiredQuantityMl: sosRequest.requiredQuantityMl,
            status: sosRequest.status,
            fulfilledBy: staffId,
            bagsUsed: bags.length,
            fulfilledByInventory: true,
            deepLink: `/sos-requests/${sosRequest._id.toString()}`
          },
          channels: ['WebPush', 'Email'],
          priority: 'high'
        });
      } catch (notifError) {
        console.error('[SOSRequestService] Failed to send fulfillment notification:', notifError);
        // Don't throw - fulfillment succeeded, notification is secondary
      }

      return {
        success: true,
        message: `Fulfilled SOS Request with ${bags.length} bag(s) (${totalVolumeMl}ml)`,
        data: {
          sosRequestId: sosRequest._id,
          bagsUsed: bags.length,
          totalVolumeMl,
          newCollectedQuantityMl: newCollectedQuantity,
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
}
