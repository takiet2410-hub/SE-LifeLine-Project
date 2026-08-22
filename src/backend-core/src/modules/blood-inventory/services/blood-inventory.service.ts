import mongoose, { PipelineStage, Types } from 'mongoose';
import { BloodBag, IBloodBag, BagStatus, BloodType } from '../models/blood-bag.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { User } from '../../auth-account/models/user.model';
import { Campaign } from '../../campaign/models/campaign.model';
import { Appointment } from '../../booking/models/appointment.model';
import { StockInEntryInput, StockOutInput } from '../schemas/blood-inventory.schema';

export class BloodInventoryService {
  static async getInventoryList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    bloodType?: string;
    status?: string;
    sort?: string;
    startDate?: string;
    endDate?: string;
    bloodCenterId?: string;
  }) {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 10);
    const skip = (page - 1) * limit;

    const query: any = {};
    const andConditions: any[] = [];

    if (params?.bloodCenterId && Types.ObjectId.isValid(params.bloodCenterId)) {
      andConditions.push({
        $or: [
          { bloodCenterId: new Types.ObjectId(params.bloodCenterId) },
          { bloodCenterId: { $exists: false } },
          { bloodCenterId: null }
        ]
      });
    }

    if (params?.search) {
      andConditions.push({
        $or: [
          { bagCode: { $regex: params.search, $options: 'i' } },
          { storageLocation: { $regex: params.search, $options: 'i' } }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    if (params?.bloodType && params.bloodType !== 'All') {
      query.bloodType = params.bloodType;
    }

    if (params?.status && params.status !== 'All') {
      query.status = params.status;
    }

    if (params?.startDate || params?.endDate) {
      query.collectionDate = {};
      if (params.startDate) query.collectionDate.$gte = new Date(params.startDate);
      if (params.endDate) query.collectionDate.$lte = new Date(params.endDate);
    }

    const sortField = params?.sort ? params.sort.split(':')[0] : 'expiryDate';
    const sortOrder = params?.sort && params.sort.includes('desc') ? -1 : 1;

    const [bags, total] = await Promise.all([
      BloodBag.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      BloodBag.countDocuments(query)
    ]);

    const summaryQuery: any = params?.bloodCenterId && Types.ObjectId.isValid(params.bloodCenterId) ? {
      $or: [
        { bloodCenterId: new Types.ObjectId(params.bloodCenterId) },
        { bloodCenterId: { $exists: false } },
        { bloodCenterId: null }
      ]
    } : {};
    const allBags = await BloodBag.find(summaryQuery).lean();
    const totalBags = allBags.length;
    const availableBags = allBags.filter((b) => b.status === 'Available').length;
    const usedBags = allBags.filter((b) => b.status === 'Used').length;
    const totalVolumeMl = allBags
      .filter((b) => b.status === 'Available')
      .reduce((sum, b) => sum + (b.volumeMl || 0), 0);

    const now = new Date();
    const nearExpiryCount = allBags.filter((b) => {
      const exp = new Date(b.expiryDate);
      const diffMs = exp.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 7 && b.status === 'Available';
    }).length;

    const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const lowStockTypesCount = bloodTypes.filter((type) => {
      const count = allBags.filter((b) => b.bloodType === type && b.status === 'Available').length;
      return count < 5;
    }).length;

    return {
      bags,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      },
      summary: {
        totalBags,
        availableBags,
        usedBags,
        totalVolumeMl,
        nearExpiryCount,
        lowStockTypesCount
      }
    };
  }

  static async getBloodBagById(bagId: string) {
    const bag = await BloodBag.findById(bagId)
      .populate('donorSourceId', 'fullName idDocumentNumber phone email')
      .populate('campaignSourceId', 'campaignCode name venue fullAddress status startDateTime endDateTime bloodCenterId')
      .lean();
    if (!bag) {
      throw new Error('Blood bag not found');
    }

    // Populate Donor & DonorProfile to ensure fullName, phone, CCCD and email are always available
    const donorRawId = (bag.donorSourceId as any)?._id || bag.donorSourceId;
    if (donorRawId) {
      let donorProf: any = null;
      let userObj: any = null;

      try {
        donorProf = await DonorProfile.findOne({
          $or: [
            { userId: donorRawId },
            { _id: donorRawId }
          ]
        }).lean();
      } catch (e) {}

      try {
        userObj = await User.findById(donorRawId).lean();
        if (!userObj && donorProf?.userId) {
          userObj = await User.findById(donorProf.userId).lean();
        }
      } catch (e) {}

      if (!donorProf && userObj) {
        try {
          const orConds: any[] = [{ userId: userObj._id }];
          if (userObj.idDocumentNumber) orConds.push({ idDocumentNumber: userObj.idDocumentNumber });
          if (userObj.phone) orConds.push({ phoneNumber: userObj.phone });
          if (userObj.email) orConds.push({ email: userObj.email });
          donorProf = await DonorProfile.findOne({ $or: orConds }).lean();
        } catch (e) {}
      }

      const fullName = donorProf?.fullName || userObj?.fullName || (bag.donorSourceId as any)?.fullName || 'Người hiến máu';
      const phoneNumber = donorProf?.phoneNumber || userObj?.phone || (bag.donorSourceId as any)?.phone || (bag.donorSourceId as any)?.phoneNumber || 'Chưa cập nhật';
      const idDocumentNumber = donorProf?.idDocumentNumber || userObj?.idDocumentNumber || (bag.donorSourceId as any)?.idDocumentNumber || 'Chưa cập nhật';
      const email = donorProf?.email || userObj?.email || (bag.donorSourceId as any)?.email || '';

      bag.donorSourceId = {
        _id: donorRawId.toString(),
        fullName,
        phoneNumber,
        phone: phoneNumber,
        idDocumentNumber,
        email
      } as any;
    }

    // Populate Campaign correctly
    let campaignObj: any = bag.campaignSourceId;
    let camp: any = null;

    if (campaignObj && typeof campaignObj === 'object' && campaignObj.name) {
      camp = campaignObj;
    } else {
      const campId = campaignObj?._id || campaignObj;
      if (campId && mongoose.Types.ObjectId.isValid(campId)) {
        camp = await Campaign.findById(campId).lean();
      }

      // Fallback: Try finding campaign from Donor's appointment if donorId exists
      if (!camp && bag.donorSourceId) {
        const donorId = (bag.donorSourceId as any)._id || bag.donorSourceId;
        const appt = await Appointment.findOne({ donorId }).sort({ appointmentDate: -1, createdAt: -1 }).lean();
        if (appt && appt.campaignId) {
          camp = await Campaign.findById(appt.campaignId).lean();
        }
      }
    }

    if (camp) {
      bag.campaignSourceId = {
        _id: camp._id ? camp._id.toString() : '',
        campaignCode: camp.campaignCode || 'CP-2026-001',
        name: camp.name,
        venue: camp.venue || camp.fullAddress || 'TT Tiếp nhận máu LifeLine',
        fullAddress: camp.fullAddress || camp.venue || 'TP. Hồ Chí Minh',
        status: camp.status || 'Active'
      } as any;
    } else {
      bag.campaignSourceId = {
        _id: '',
        campaignCode: 'N/A',
        name: 'Tiếp nhận trực tiếp tại Trung tâm',
        venue: 'Kho máu LifeLine',
        fullAddress: 'TP. Hồ Chí Minh',
        status: 'Active'
      } as any;
    }

    return bag;
  }
  static async updateBagStatus(bagId: string, status: BagStatus, reason: string, staffName: string = 'Staff') {
    const bag = await BloodBag.findById(bagId);
    if (!bag) {
      throw new Error('Blood bag not found');
    }

    if (bag.status === 'Expired' || bag.status === 'Used' || bag.status === 'Discarded') {
      if (bag.status !== status) {
        throw new Error(`Cannot change status from terminal state '${bag.status}'`);
      }
    }

    const historyEntry = {
      previousStatus: bag.status,
      newStatus: status,
      changedBy: staffName,
      changedAt: new Date(),
      reason
    };

    bag.status = status;
    bag.statusHistory.unshift(historyEntry);
    await bag.save();
    return bag;
  }

  static async stockInBatch(entries: StockInEntryInput[], staffName: string = 'Staff', bloodCenterId?: any) {
    const createdBags: IBloodBag[] = [];

    for (const entry of entries) {
      const randomCode = `BB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const bag = new BloodBag({
        bagCode: randomCode,
        bloodType: entry.bloodType,
        volumeMl: entry.volumeMl,
        collectionDate: new Date(entry.collectionDate),
        expiryDate: new Date(entry.expiryDate),
        storageLocation: entry.storageLocation,
        bloodCenterId: bloodCenterId || (entry as any).bloodCenterId,
        status: 'Available',
        statusHistory: [
          {
            previousStatus: 'None',
            newStatus: 'Available',
            changedBy: staffName,
            changedAt: new Date(),
            reason: 'Stock in batch registration'
          }
        ]
      });

      await bag.save();
      createdBags.push(bag);
    }

    return createdBags;
  }

  static async stockOutBatch(input: StockOutInput, staffName: string = 'Staff') {
    const { bagIds, reason, notes } = input;

    const bags = await BloodBag.find({ _id: { $in: bagIds } });
    if (bags.length === 0) {
      throw new Error('No valid blood bags found for stock out');
    }

    const targetStatus = reason === 'Disposal' ? 'Discarded' : 'Used';

    const updatedCount = await BloodBag.updateMany(
      { _id: { $in: bagIds } },
      {
        $set: { status: targetStatus },
        $push: {
          statusHistory: {
            $each: [
              {
                previousStatus: 'Available',
                newStatus: targetStatus,
                changedBy: staffName,
                changedAt: new Date(),
                reason: `Stock out: ${reason}${notes ? ` (${notes})` : ''}`
              }
            ],
            $position: 0
          }
        }
      }
    );

    return updatedCount.modifiedCount;
  }

  static async getInventoryStatistics(bloodCenterId?: string) {
    const query: any = bloodCenterId && Types.ObjectId.isValid(bloodCenterId) ? {
      $or: [
        { bloodCenterId: new Types.ObjectId(bloodCenterId) },
        { bloodCenterId: { $exists: false } },
        { bloodCenterId: null }
      ]
    } : {};
    const bags = await BloodBag.find(query).lean();
    const totalUnits = bags.length;
    const availableUnits = bags.filter((b) => b.status === 'Available').length;

    const now = new Date();
    const nearExpiryUnits = bags.filter((b) => {
      const exp = new Date(b.expiryDate);
      const diffMs = exp.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 7 && b.status === 'Available';
    }).length;

    const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const byBloodType = bloodTypes.map((type) => {
      const typeBags = bags.filter((b) => b.bloodType === type && b.status === 'Available');
      const count = typeBags.length;
      const volumeMl = typeBags.reduce((sum, b) => sum + (b.volumeMl || 0), 0);
      const nearExp = typeBags.filter((b) => {
        const exp = new Date(b.expiryDate);
        const diffMs = exp.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }).length;

      let status: 'Critical' | 'Low Stock' | 'Sufficient' = 'Sufficient';
      if (count < 2) status = 'Critical';
      else if (count < 5) status = 'Low Stock';

      return {
        bloodType: type,
        totalUnits: count,
        volumeMl,
        nearExpiry: nearExp,
        status
      };
    });

    const lowStockTypesCount = byBloodType.filter((t) => t.status !== 'Sufficient').length;

    return {
      summaryCards: {
        totalUnits,
        availableUnits,
        nearExpiryUnits,
        lowStockTypesCount
      },
      byBloodType
    };
  }
}
