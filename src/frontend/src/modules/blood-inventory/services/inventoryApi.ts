import type { BloodBagItem, InventoryListResponse, InventoryStatisticsData, BagStatus } from '../types/inventory.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

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
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.bloodType) query.append('bloodType', params.bloodType);
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/bc/inventory?${query.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Failed to fetch inventory');
    const json = await res.json();
    return json;
  },

  async getBloodBagById(id: string): Promise<BloodBagItem | null> {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/bc/inventory/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Failed to fetch blood bag details');
    const json = await res.json();
    return json.data;
  },

  async updateStatus(id: string, status: BagStatus, reason?: string): Promise<BloodBagItem | null> {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/bc/inventory/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status, reason })
    });
    if (!res.ok) throw new Error('Failed to update blood bag status');
    const json = await res.json();
    return json.data;
  },

  async stockIn(entries: Array<{
    bloodType: string;
    volumeMl: number;
    collectionDate: string;
    expiryDate: string;
    storageLocation: string;
  }>): Promise<BloodBagItem[]> {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/bc/inventory/stock-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ entries })
    });
    if (!res.ok) throw new Error('Failed to stock in blood bags');
    const json = await res.json();
    return json.data;
  },

  async stockOut(bagIds: string[], reason: string, notes?: string): Promise<boolean> {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/bc/inventory/stock-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ bagIds, reason, notes })
    });
    if (!res.ok) throw new Error('Failed to stock out blood bags');
    return true;
  },

  async getStatistics(): Promise<InventoryStatisticsData> {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/bc/inventory/statistics`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Failed to fetch inventory statistics');
    const json = await res.json();
    return json.data;
  }
};
