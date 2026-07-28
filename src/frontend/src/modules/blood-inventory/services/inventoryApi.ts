import { apiService as mockApiService } from '../../../services/apiClient';
import type { BloodBagItem, InventoryListResponse, InventoryStatisticsData, BagStatus } from '../types/inventory.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const inventoryApi = {
  async getInventory(params?: {
    page?: number;
    limit?: number;
    search?: string;
    bloodType?: string;
    status?: string;
  }): Promise<InventoryListResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.bloodType) query.append('bloodType', params.bloodType);
      if (params?.status) query.append('status', params.status);

      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/bc/inventory?${query.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to mock API if backend endpoint is unavailable
    }

    const mockBags = await mockApiService.getInventory(params?.search, params?.bloodType, params?.status);
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const total = mockBags.length;
    const startIndex = (page - 1) * limit;
    const paginatedBags = mockBags.slice(startIndex, startIndex + limit);

    const availableBags = mockBags.filter((b: any) => b.status === 'Available').length;
    const totalVolumeMl = mockBags.reduce((acc: number, b: any) => acc + (b.volumeMl || 0), 0);
    const now = new Date();
    const nearExpiryCount = mockBags.filter((b: any) => {
      const exp = new Date(b.expiryDate);
      const diff = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diff > 0 && diff <= 7 && b.status === 'Available';
    }).length;

    return {
      success: true,
      data: paginatedBags as any,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      },
      summary: {
        totalBags: total,
        availableBags,
        totalVolumeMl,
        nearExpiryCount,
        lowStockTypesCount: 1
      }
    };
  },

  async getBloodBagById(id: string): Promise<BloodBagItem | null> {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/bc/inventory/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback to mock API
    }
    return (await mockApiService.getBloodBagById(id)) as any;
  },

  async updateStatus(id: string, status: BagStatus, reason?: string): Promise<BloodBagItem | null> {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/bc/inventory/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, reason })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback to mock API
    }
    return (await mockApiService.updateBloodBagStatus(id, status as any, reason)) as any;
  },

  async stockIn(entries: Array<{
    bloodType: string;
    volumeMl: number;
    collectionDate: string;
    expiryDate: string;
    storageLocation: string;
  }>): Promise<BloodBagItem[]> {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/bc/inventory/stock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ entries })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback to mock API
    }
    return (await mockApiService.stockIn(entries)) as any;
  },

  async stockOut(bagIds: string[], reason: string, notes?: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/bc/inventory/stock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ bagIds, reason, notes })
      });
      if (res.ok) {
        return true;
      }
    } catch {
      // Fallback to mock API
    }
    return await mockApiService.stockOut(bagIds, reason, notes);
  },

  async getStatistics(): Promise<InventoryStatisticsData> {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/bc/inventory/statistics`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback to mock API
    }
    const mockStats = await mockApiService.getInventoryStatistics();
    return {
      summaryCards: {
        totalUnits: mockStats.totalUnits,
        availableUnits: mockStats.availableUnits,
        nearExpiryUnits: mockStats.nearExpiryUnits,
        lowStockTypesCount: mockStats.lowStockTypes.length
      },
      byBloodType: mockStats.unitsByBloodType.map((u: any) => ({
        bloodType: u.type as any,
        totalUnits: u.count,
        volumeMl: u.count * 350,
        nearExpiry: 0,
        status: u.count < 2 ? 'Critical' : u.count < 5 ? 'Low Stock' : 'Sufficient'
      }))
    };
  }
};
