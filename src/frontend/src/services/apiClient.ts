import type {
  CampaignData,
  RegistrationData,
  ArticleData,
  BloodBagData,
} from './mockData';
import {
  initialCampaigns,
  initialRegistrations,
  initialArticles,
  initialNotifications,
  initialBloodBags,
} from './mockData';

// In-memory state store for modules without real backend APIs yet.
// These modules (campaign-mgmt, content-mgmt, notifications, blood-inventory)
// will use mock data until their corresponding backend endpoints are implemented.
let campaigns = [...initialCampaigns];
let registrations = [...initialRegistrations];
let articles = [...initialArticles];
let notifications = [...initialNotifications];
let bloodBags = [...initialBloodBags];

// Helper delay to simulate API latency for mock endpoints
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiService = {
  // ==================== CAMPAIGN APIs (Mock - no backend yet) ====================
  async getCampaigns(params?: { search?: string; status?: string }) {
    await delay();
    let result = [...campaigns];
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.venue.toLowerCase().includes(q)
      );
    }
    if (params?.status && params.status !== 'All') {
      result = result.filter((c) => c.status === params.status);
    }
    return result;
  },

  async getCampaignById(id: string) {
    await delay();
    return campaigns.find((c) => c._id === id) || null;
  },

  async createCampaign(data: Omit<CampaignData, '_id' | 'registeredCount' | 'createdAt'>) {
    await delay();
    const newCampaign: CampaignData = {
      ...data,
      _id: `cam-${Date.now()}`,
      registeredCount: 0,
      createdAt: new Date().toISOString(),
    };
    campaigns = [newCampaign, ...campaigns];
    return newCampaign;
  },

  async updateCampaign(id: string, updates: Partial<CampaignData>) {
    await delay();
    const idx = campaigns.findIndex((c) => c._id === id);
    if (idx === -1) return null;
    campaigns[idx] = { ...campaigns[idx], ...updates };
    return campaigns[idx];
  },

  // ==================== REGISTRATION APIs (Mock - no backend yet) ====================
  async getRegistrations(campaignId: string, search?: string, status?: string) {
    await delay();
    let result = registrations.filter((r) => r.campaignId === campaignId);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r._id.toLowerCase().includes(q) ||
          r.donorName.toLowerCase().includes(q) ||
          r.donorIdCard.includes(q)
      );
    }
    if (status && status !== 'All') {
      result = result.filter((r) => r.status === status);
    }
    return result;
  },

  async getRegistrationById(id: string) {
    await delay();
    return registrations.find((r) => r._id === id) || null;
  },

  async updateRegistration(id: string, updates: Partial<RegistrationData>) {
    await delay();
    const idx = registrations.findIndex((r) => r._id === id);
    if (idx === -1) return null;
    registrations[idx] = { ...registrations[idx], ...updates };
    return registrations[idx];
  },

  // ==================== ARTICLE APIs (Mock - no backend yet) ====================
  async getArticles(category?: string, status?: string) {
    await delay();
    let result = [...articles];
    if (category && category !== 'All') {
      result = result.filter((a) => a.category === category);
    }
    if (status && status !== 'All') {
      result = result.filter((a) => a.status === status);
    }
    return result;
  },

  async getArticleById(id: string) {
    await delay();
    return articles.find((a) => a._id === id) || null;
  },

  async createArticle(data: Omit<ArticleData, '_id' | 'createdAt' | 'authorStaffId' | 'authorName'>) {
    await delay();
    const newArt: ArticleData = {
      ...data,
      _id: `art-${Date.now()}`,
      authorStaffId: 'staff-01',
      authorName: 'BS. Nguyễn Văn A',
      createdAt: new Date().toISOString(),
    };
    articles = [newArt, ...articles];
    return newArt;
  },

  async updateArticle(id: string, updates: Partial<ArticleData>) {
    await delay();
    const idx = articles.findIndex((a) => a._id === id);
    if (idx === -1) return null;
    articles[idx] = { ...articles[idx], ...updates };
    return articles[idx];
  },

  // ==================== NOTIFICATION APIs (Mock - no backend yet) ====================
  async getNotifications(type?: string, status?: string) {
    await delay();
    let result = [...notifications];
    if (type && type !== 'All') {
      result = result.filter((n) => n.type === type);
    }
    if (status === 'Unread') {
      result = result.filter((n) => n.readAt === null);
    } else if (status === 'Read') {
      result = result.filter((n) => n.readAt !== null);
    }

    // SOS pinning: SOS items always at top
    const sosItems = result.filter((n) => n.type === 'SOS');
    const normalItems = result.filter((n) => n.type !== 'SOS');
    return [...sosItems, ...normalItems];
  },

  async getNotificationById(id: string) {
    await delay();
    const idx = notifications.findIndex((n) => n._id === id);
    if (idx === -1) return null;
    // BUG-08 FIX: mutate array gốc để persist trạng thái "đã đọc"
    // Trước đây: return { ...notif, readAt: ... } — không mutate → sau reload vẫn unread
    if (notifications[idx].readAt === null) {
      notifications[idx] = {
        ...notifications[idx],
        readAt: new Date().toISOString(),
      };
    }
    return notifications[idx];
  },

  async markNotificationAsRead(id: string) {
    await delay();
    notifications = notifications.map((n) =>
      n._id === id ? { ...n, readAt: new Date().toISOString() } : n
    );
  },

  async removeNotification(id: string) {
    await delay();
    notifications = notifications.filter((n) => n._id !== id);
  },

  // ==================== INVENTORY APIs (Mock - no backend yet) ====================
  async getInventory(search?: string, bloodType?: string, status?: string) {
    await delay();
    let result = [...bloodBags];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.bagCode.toLowerCase().includes(q) ||
          b.storageLocation.toLowerCase().includes(q)
      );
    }
    if (bloodType && bloodType !== 'All') {
      result = result.filter((b) => b.bloodType === bloodType);
    }
    if (status && status !== 'All') {
      result = result.filter((b) => b.status === status);
    }
    return result;
  },

  async getBloodBagById(id: string) {
    await delay();
    return bloodBags.find((b) => b._id === id) || null;
  },

  async updateBloodBagStatus(id: string, newStatus: BloodBagData['status'], reason?: string) {
    await delay();
    const idx = bloodBags.findIndex((b) => b._id === id);
    if (idx === -1) return null;

    const historyEntry = {
      previousStatus: bloodBags[idx].status,
      newStatus,
      changedBy: 'BS. Nguyễn Văn A',
      changedAt: new Date().toISOString(),
      reason: reason || 'Thay đổi trạng thái thủ công',
    };

    bloodBags[idx] = {
      ...bloodBags[idx],
      status: newStatus,
      statusHistory: [historyEntry, ...bloodBags[idx].statusHistory],
    };
    return bloodBags[idx];
  },

  async stockIn(
    entries: Array<{
      bloodType: string;
      volumeMl: number;
      collectionDate: string;
      expiryDate: string;
      storageLocation: string;
    }>
  ) {
    await delay();
    const newBags: BloodBagData[] = entries.map((e, idx) => ({
      _id: `bag-${Date.now()}-${idx}`,
      bagCode: `BB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      bloodType: e.bloodType,
      volumeMl: e.volumeMl,
      collectionDate: e.collectionDate,
      expiryDate: e.expiryDate,
      storageLocation: e.storageLocation,
      status: 'Available',
      statusHistory: [
        {
          previousStatus: 'None',
          newStatus: 'Available',
          changedBy: 'BS. Nguyễn Văn A',
          changedAt: new Date().toISOString(),
          reason: 'Nhập kho hàng loạt',
        },
      ],
    }));

    bloodBags = [...newBags, ...bloodBags];
    return newBags;
  },

  async stockOut(
    bagIds: string[],
    reason: string,
    notes?: string
  ): Promise<boolean> {
    await delay();
    bloodBags = bloodBags.map((b) => {
      if (bagIds.includes(b._id)) {
        return {
          ...b,
          status: 'Used',
          statusHistory: [
            {
              previousStatus: b.status,
              newStatus: 'Used',
              changedBy: 'BS. Nguyễn Văn A',
              changedAt: new Date().toISOString(),
              reason: `Xuất kho: ${reason}${notes ? ` (${notes})` : ''}`,
            },
            ...b.statusHistory,
          ],
        };
      }
      return b;
    });
    return true;
  },

  async getInventoryStatistics() {
    await delay();
    const totalUnits = bloodBags.length;
    const availableUnits = bloodBags.filter((b) => b.status === 'Available').length;

    const now = new Date();
    const nearExpiryUnits = bloodBags.filter((b) => {
      const exp = new Date(b.expiryDate);
      const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays > 0 && diffDays <= 7 && b.status === 'Available';
    }).length;

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const unitsByBloodType = bloodTypes.map((type) => {
      const count = bloodBags.filter(
        (b) => b.bloodType === type && b.status === 'Available'
      ).length;
      return { type, count };
    });

    const lowStockTypes = unitsByBloodType.filter((u) => u.count < 3).map((u) => u.type);

    return {
      totalUnits,
      availableUnits,
      nearExpiryUnits,
      lowStockTypes,
      unitsByBloodType,
    };
  },
};
