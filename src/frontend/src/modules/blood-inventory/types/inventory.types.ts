export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type BagStatus = 'Available' | 'Reserved' | 'Used' | 'Expired' | 'Discarded';

export interface StatusHistoryEntry {
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export type MedicalTestResult = 'Pass' | 'Rejected' | 'Pending';
export interface BloodBagItem {
  _id: string;
  bagCode: string;
  bloodType: BloodType;
  volumeMl: number;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  shelfPosition?: string;
  temperatureCelsius?: number;
  status: BagStatus;
  donorSourceId?: string;
  donorName?: string;
  campaignSourceId?: string;
  testResult?: MedicalTestResult;
  statusHistory: StatusHistoryEntry[];
}

export interface InventorySummary {
  totalBags: number;
  availableBags: number;
  totalVolumeMl: number;
  nearExpiryCount: number;
  lowStockTypesCount: number;
}

export interface InventoryListResponse {
  success: boolean;
  data: BloodBagItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: InventorySummary;
}

export interface InventoryStatisticsData {
  summaryCards: {
    totalUnits: number;
    availableUnits: number;
    nearExpiryUnits: number;
    lowStockTypesCount: number;
  };
  byBloodType: Array<{
    bloodType: BloodType;
    totalUnits: number;
    volumeMl: number;
    nearExpiry: number;
    status: 'Critical' | 'Low Stock' | 'Sufficient';
  }>;
}
