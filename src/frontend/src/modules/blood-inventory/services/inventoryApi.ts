import { apiClient } from '../../../shared/api/apiClient';
import type { BloodBagItem, InventoryListResponse, InventoryStatisticsData, BagStatus } from '../types/inventory.types';

export const inventoryApi = {
  async getInventory(params?: {
    page?: number;
    limit?: number;
    search?: string;
    bloodType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<InventoryListResponse> {
    const res = await apiClient.get('/bc/inventory', { params });
    return res.data;
  },

  async getBloodBagById(id: string): Promise<BloodBagItem | null> {
    const res = await apiClient.get(`/bc/inventory/${id}`);
    return res.data?.data || res.data;
  },

  async updateStatus(id: string, status: BagStatus, reason?: string): Promise<BloodBagItem | null> {
    const res = await apiClient.put(`/bc/inventory/${id}/status`, { status, reason });
    return res.data?.data || res.data;
  },

  async stockIn(entries: Array<{
    bloodType: string;
    volumeMl: number;
    collectionDate: string;
    expiryDate: string;
    storageLocation: string;
  }>): Promise<BloodBagItem[]> {
    const res = await apiClient.post('/bc/inventory/stock-in', { entries });
    return res.data?.data || res.data;
  },

  async stockOut(bagIds: string[], reason: string, notes?: string): Promise<boolean> {
    await apiClient.post('/bc/inventory/stock-out', { bagIds, reason, notes });
    return true;
  },

  async getStatistics(params?: { bloodCenterId?: string }): Promise<InventoryStatisticsData> {
    const res = await apiClient.get('/bc/inventory/statistics', { params });
    return res.data?.data || res.data;
  }
};
