import { BloodBag, IBloodBag, BagStatus, BloodType } from '../models/blood-bag.model';
import { StockInEntryInput, StockOutInput } from '../schemas/blood-inventory.schema';

export class BloodInventoryService {
  static async getInventoryList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    bloodType?: string;
    status?: string;
    sort?: string;
  }) {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    if (params?.search) {
      query.bagCode = { $regex: params.search, $options: 'i' };
    }

    if (params?.bloodType && params.bloodType !== 'All') {
      query.bloodType = params.bloodType;
    }

    if (params?.status && params.status !== 'All') {
      query.status = params.status;
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

    const allBags = await BloodBag.find({}).lean();
    const totalBags = allBags.length;
    const availableBags = allBags.filter((b) => b.status === 'Available').length;
    const totalVolumeMl = allBags.reduce((sum, b) => sum + (b.volumeMl || 0), 0);

    const now = new Date();
    const nearExpiryCount = allBags.filter((b) => {
      const exp = new Date(b.expiryDate);
      const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays > 0 && diffDays <= 7 && b.status === 'Available';
    }).length;

    const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const lowStockTypesCount = bloodTypes.filter((type) => {
      const count = allBags.filter((b) => b.bloodType === type && b.status === 'Available').length;
      return count < 3;
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
        totalVolumeMl,
        nearExpiryCount,
        lowStockTypesCount
      }
    };
  }

  static async getBloodBagById(bagId: string) {
    const bag = await BloodBag.findById(bagId).lean();
    if (!bag) {
      throw new Error('Blood bag not found');
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

  static async stockInBatch(entries: StockInEntryInput[], staffName: string = 'Staff') {
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

    const updatedCount = await BloodBag.updateMany(
      { _id: { $in: bagIds } },
      {
        $set: { status: 'Used' },
        $push: {
          statusHistory: {
            $each: [
              {
                previousStatus: 'Available',
                newStatus: 'Used',
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

  static async getInventoryStatistics() {
    const bags = await BloodBag.find({}).lean();
    const totalUnits = bags.length;
    const availableUnits = bags.filter((b) => b.status === 'Available').length;

    const now = new Date();
    const nearExpiryUnits = bags.filter((b) => {
      const exp = new Date(b.expiryDate);
      const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays > 0 && diffDays <= 7 && b.status === 'Available';
    }).length;

    const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const byBloodType = bloodTypes.map((type) => {
      const typeBags = bags.filter((b) => b.bloodType === type && b.status === 'Available');
      const count = typeBags.length;
      const volumeMl = typeBags.reduce((sum, b) => sum + (b.volumeMl || 0), 0);
      const nearExp = typeBags.filter((b) => {
        const exp = new Date(b.expiryDate);
        const diff = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
        return diff > 0 && diff <= 7;
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
