import mongoose, { PipelineStage, Types } from 'mongoose';
import { BloodBag, IBloodBag, BagStatus, BloodType } from '../models/blood-bag.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
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

    if (params?.bloodCenterId) {
      query.bloodCenterId = params.bloodCenterId;
    }

    if (params?.search) {
      query.$or = [
        { bagCode: { $regex: params.search, $options: 'i' } },
        { storageLocation: { $regex: params.search, $options: 'i' } }
      ];
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

    const summaryQuery: any = params?.bloodCenterId ? { bloodCenterId: params.bloodCenterId } : {};
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
      .populate('donorSourceId', 'idDocumentNumber phone email')
      .populate('campaignSourceId', 'campaignCode name venue fullAddress status startDateTime endDateTime')
      .lean();
    if (!bag) {
      throw new Error('Blood bag not found');
    }

    // Populate DonorProfile to get fullName and phoneNumber
    if (bag.donorSourceId && (bag.donorSourceId as any)._id) {
      const donorProf = await DonorProfile.findOne({
        $or: [
          { userId: (bag.donorSourceId as any)._id },
          { _id: (bag.donorSourceId as any)._id }
        ]
      }).lean();
      if (donorProf) {
        (bag.donorSourceId as any).fullName = donorProf.fullName;
        (bag.donorSourceId as any).phoneNumber = donorProf.phoneNumber || (bag.donorSourceId as any).phone;
      }
    }

    // Populate Campaign if campaignSourceId is not populated or fallback to active campaign
    let campaignObj: any = bag.campaignSourceId;
    if (!campaignObj || typeof campaignObj !== 'object' || !campaignObj.name) {
      let campId = campaignObj?._id || campaignObj;
      let camp = campId ? await Campaign.findById(campId).lean() : null;

      // Fallback 1: Try finding campaign from Donor's appointment
      if (!camp && bag.donorSourceId) {
        const donorId = (bag.donorSourceId as any)._id || bag.donorSourceId;
        const appt = await Appointment.findOne({ donorId }).sort({ appointmentDate: -1 }).lean();
        if (appt && appt.campaignId) {
          camp = await Campaign.findById(appt.campaignId).lean();
        }
      }

      // Fallback 2: Try finding any active/recent campaign
      if (!camp) {
        camp = await Campaign.findOne({ status: { $in: ['Active', 'Upcoming', 'Completed'] } })
          .sort({ startDateTime: -1, createdAt: -1 })
          .lean();
      }

      if (camp) {
        bag.campaignSourceId = {
          _id: camp._id.toString(),
          campaignCode: camp.campaignCode || 'CP-2026-001',
          name: camp.name,
          venue: camp.venue || camp.fullAddress,
          fullAddress: camp.fullAddress || camp.venue,
          status: camp.status
        } as any;
      }
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
    const query: any = bloodCenterId ? { bloodCenterId } : {};
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
