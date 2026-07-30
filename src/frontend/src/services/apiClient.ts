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
import { apiClient } from '../shared/api/apiClient';

// Local in-memory fallbacks
let campaigns = [...initialCampaigns];
let registrations = [...initialRegistrations];
let articles = [...initialArticles];
let notifications = [...initialNotifications];
let bloodBags = [...initialBloodBags];

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiService = {
  // ==================== CAMPAIGN APIs ====================
  async getCampaigns(params?: { search?: string; status?: string }) {
    try {
      const queryParams: any = {};
      if (params?.search) queryParams.location = params.search;
      if (params?.status && params.status !== 'All') queryParams.status = params.status;

      const res = await apiClient.get('/campaigns', { params: queryParams });
      const rawData = res.data?.data || res.data;
      if (Array.isArray(rawData) && rawData.length > 0) {
        return rawData as CampaignData[];
      }
    } catch (err) {
      console.warn('[apiService] Backend getCampaigns failed, falling back to local dataset:', err);
    }

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
    try {
      const res = await apiClient.get(`/campaigns/${id}`);
      if (res.data) {
        return res.data as CampaignData;
      }
    } catch (err) {
      console.warn('[apiService] Backend getCampaignById failed, using fallback:', err);
    }

    await delay();
    return campaigns.find((c) => c._id === id) || null;
  },

  async createCampaign(data: Omit<CampaignData, '_id' | 'registeredCount' | 'createdAt'>) {
    try {
      const res = await apiClient.post('/campaigns', {
        ...data,
        fullAddress: (data as any).fullAddress || data.venue || 'TP. Hồ Chí Minh',
        description: (data as any).description || data.name,
        targetUnitsGoal: data.capacity ? Math.round(data.capacity * 0.8) : 80,
        contactPerson: { name: 'Cán bộ Kho máu', phone: '0909123456' },
      });
      if (res.data) {
        return res.data as CampaignData;
      }
    } catch (err) {
      console.warn('[apiService] Backend createCampaign failed, using fallback:', err);
    }

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
    try {
      const res = await apiClient.put(`/campaigns/${id}`, updates);
      if (res.data) {
        return res.data as CampaignData;
      }
    } catch (err) {
      console.warn('[apiService] Backend updateCampaign failed, using fallback:', err);
    }

    await delay();
    const idx = campaigns.findIndex((c) => c._id === id);
    if (idx === -1) return null;
    campaigns[idx] = { ...campaigns[idx], ...updates };
    return campaigns[idx];
  },

  // ==================== REGISTRATION APIs ====================
  async getRegistrations(campaignId: string, search?: string, status?: string) {
    try {
      const endpoint = `/campaigns/${campaignId || 'all'}/registrations`;
      const res = await apiClient.get(endpoint);
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || null);
      if (rawList && Array.isArray(rawList)) {
        let result = rawList.map((item: any) => {
          const donorObj = typeof item.donorId === 'object' ? item.donorId : (item.donor || {});
          const screeningObj = item.screening || item.screeningFormId || item.screeningForm || null;
          
          const donorName = (item.donorName && item.donorName !== 'N/A')
            ? item.donorName
            : (donorObj.fullName || item.donor?.fullName || item.donorId?.fullName || item.fullName || 'Người hiến máu');

          const donorBloodType = (item.donorBloodType && item.donorBloodType !== 'Unknown')
            ? item.donorBloodType
            : (donorObj.bloodType || item.donor?.bloodType || item.donorId?.bloodType || 'Unknown');

          const donorDob = item.donorDob || donorObj.dateOfBirth || item.donor?.dateOfBirth || item.donorId?.dateOfBirth || '';

          const donorIdCard = (item.donorIdCard && item.donorIdCard !== 'N/A' && item.donorIdCard !== 'Chưa cập nhật')
            ? item.donorIdCard
            : (donorObj.idDocumentNumber || item.donor?.idDocumentNumber || item.donorId?.idDocumentNumber || 'Chưa cập nhật');

          const donorPhone = (item.donorPhone && item.donorPhone !== 'N/A' && item.donorPhone !== 'Chưa cập nhật SĐT')
            ? item.donorPhone
            : (donorObj.phoneNumber || donorObj.phone || item.donor?.phoneNumber || item.donorId?.phone || 'Chưa cập nhật SĐT');

          return {
            _id: item._id || item.id || item.registrationId,
            campaignId: item.campaignId?._id || item.campaignId || campaignId,
            donorId: donorObj._id || donorObj.donorId || item.donorId || '',
            donorName,
            donorBloodType,
            donorDob,
            donorIdCard,
            donorPhone,
            appointmentDate: item.appointmentDate || new Date().toISOString(),
            status: item.status || 'Pending',
            screeningForm: screeningObj,
          };
        });

        // Filter out Cancelled and NoShow by default unless explicitly requested
        if (!status || status === 'All') {
          result = result.filter(
            (r: any) =>
              r.status !== 'Cancelled' &&
              r.status !== 'NoShow' &&
              r.status !== 'cancelled' &&
              r.status !== 'no-show'
          );
        } else {
          result = result.filter((r: any) => r.status === status);
        }

        if (search) {
          const q = search.toLowerCase();
          result = result.filter(
            (r: any) =>
              r._id.toLowerCase().includes(q) ||
              r.donorName.toLowerCase().includes(q) ||
              r.donorIdCard.includes(q)
          );
        }
        return result as RegistrationData[];
      }
      return [];
    } catch (err) {
      console.warn('[apiService] Backend getRegistrations failed:', err);
      return [];
    }
  },

  async getRegistrationById(id: string) {
    try {
      const res = await apiClient.get(`/registrations/${id}`);
      if (res.data) {
        const item = res.data;
        const donorObj = typeof item.donorId === 'object' ? item.donorId : (item.donor || {});
        const screeningObj = item.screening || item.screeningForm || item.screeningFormId || null;

        const donorName = (item.donorName && item.donorName !== 'N/A')
          ? item.donorName
          : (donorObj.fullName || item.donor?.fullName || item.donorId?.fullName || item.fullName || 'Người hiến máu');

        const donorBloodType = (item.donorBloodType && item.donorBloodType !== 'Unknown')
          ? item.donorBloodType
          : (donorObj.bloodType || item.donor?.bloodType || item.donorId?.bloodType || 'Unknown');

        const donorDob = item.donorDob || donorObj.dateOfBirth || item.donor?.dateOfBirth || item.donorId?.dateOfBirth || '';

        const donorIdCard = (item.donorIdCard && item.donorIdCard !== 'N/A' && item.donorIdCard !== 'Chưa cập nhật')
          ? item.donorIdCard
          : (donorObj.idDocumentNumber || item.donor?.idDocumentNumber || item.donorId?.idDocumentNumber || 'Chưa cập nhật');

        const donorPhone = (item.donorPhone && item.donorPhone !== 'N/A' && item.donorPhone !== 'Chưa cập nhật SĐT')
          ? item.donorPhone
          : (donorObj.phoneNumber || donorObj.phone || item.donor?.phoneNumber || item.donorId?.phone || 'Chưa cập nhật SĐT');

        return {
          _id: item._id || item.id || item.registrationId || id,
          campaignId: item.campaignId?._id || item.campaignId || '',
          donorId: donorObj._id || donorObj.donorId || item.donorId || '',
          donorName,
          donorBloodType,
          donorDob,
          donorIdCard,
          donorPhone,
          appointmentDate: item.appointmentDate || new Date().toISOString(),
          status: item.status || 'CheckedIn',
          bloodPressure: screeningObj?.vitals?.bloodPressure || item.bloodPressure || '',
          weight: screeningObj?.vitals?.weight || item.weight || undefined,
          bodyTemperature: screeningObj?.vitals?.bodyTemperature || item.bodyTemperature || undefined,
          hemoglobinLevel: screeningObj?.vitals?.hemoglobinLevel || item.hemoglobinLevel || undefined,
          screeningNotes: screeningObj?.screeningNotes || item.screeningNotes || '',
          screeningForm: screeningObj,
        } as RegistrationData;
      }
    } catch (err) {
      console.warn('[apiService] Backend getRegistrationById failed:', err);
    }
    return null;
  },

  async updateRegistration(id: string, updates: Partial<RegistrationData>) {
    try {
      const hasVitals = Boolean(
        updates.bloodPressure || updates.weight || updates.bodyTemperature || updates.hemoglobinLevel
      );

      const payload: any = {
        status: updates.status,
      };

      if (hasVitals) {
        payload.vitals = {
          ...(updates.bloodPressure ? { bloodPressure: updates.bloodPressure } : {}),
          ...(updates.weight ? { weight: Number(updates.weight) } : {}),
          ...(updates.bodyTemperature ? { bodyTemperature: Number(updates.bodyTemperature) } : {}),
          ...(updates.hemoglobinLevel ? { hemoglobinLevel: Number(updates.hemoglobinLevel) } : {}),
        };
      }

      if (updates.screeningNotes !== undefined) {
        payload.screeningNotes = updates.screeningNotes;
      }
      if (updates.donorBloodType && updates.donorBloodType !== 'Unknown') {
        payload.bloodType = updates.donorBloodType;
      }

      const res = await apiClient.put(`/registrations/${id}/screening`, payload);
      if (res.data) {
        const item = res.data;
        const screeningObj = item.screening || item.screeningForm || item.screeningFormId || null;
        return {
          ...item,
          ...updates,
          status: item.status || updates.status,
          screeningForm: screeningObj || updates.screeningForm,
        } as RegistrationData;
      }
    } catch (err) {
      console.warn('[apiService] Backend updateRegistration API failed, fallback to mock state:', err);
    }

    await delay();
    const idx = registrations.findIndex((r) => r._id === id);
    if (idx === -1) {
      return {
        _id: id,
        ...updates,
      } as RegistrationData;
    }
    registrations[idx] = { ...registrations[idx], ...updates };
    return registrations[idx];
  },

  async checkInQRCode(qrPayload: string) {
    try {
      const res = await apiClient.post('/registrations/qr-checkin', { qrPayload });
      if (res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[apiService] Backend checkInQRCode failed, fallback to mock update:', err);
    }
    await delay();
    if (registrations.length > 0) {
      registrations[0].status = 'CheckedIn';
      return registrations[0];
    }
    return null;
  },

  // ==================== ARTICLE APIs ====================
  async getArticles(category?: string, status?: string) {
    try {
      const queryParams: any = {};
      if (category && category !== 'All') queryParams.category = category;
      if (status && status !== 'All') queryParams.status = status;

      const res = await apiClient.get('/bc/articles', { params: queryParams });
      const rawData = res.data?.data || res.data;
      if (Array.isArray(rawData) && rawData.length > 0) {
        return rawData as ArticleData[];
      }
    } catch (err) {
      console.warn('[apiService] Backend getArticles failed, using fallback:', err);
    }

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
    try {
      const res = await apiClient.get(`/bc/articles/${id}`);
      if (res.data) {
        return res.data as ArticleData;
      }
    } catch (err) {
      console.warn('[apiService] Backend getArticleById failed, using fallback:', err);
    }

    await delay();
    return articles.find((a) => a._id === id) || null;
  },

  async createArticle(data: Omit<ArticleData, '_id' | 'createdAt' | 'authorStaffId' | 'authorName'>) {
    try {
      const res = await apiClient.post('/bc/articles', data);
      if (res.data) return res.data as ArticleData;
    } catch (err) {
      console.warn('[apiService] Backend createArticle failed, using fallback:', err);
    }

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
    try {
      const res = await apiClient.put(`/bc/articles/${id}`, updates);
      if (res.data) return res.data as ArticleData;
    } catch (err) {
      console.warn('[apiService] Backend updateArticle failed, using fallback:', err);
    }

    await delay();
    const idx = articles.findIndex((a) => a._id === id);
    if (idx === -1) return null;
    articles[idx] = { ...articles[idx], ...updates };
    return articles[idx];
  },

  // ==================== NOTIFICATION APIs ====================
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

    const sosItems = result.filter((n) => n.type === 'SOS');
    const normalItems = result.filter((n) => n.type !== 'SOS');
    return [...sosItems, ...normalItems];
  },

  async getNotificationById(id: string) {
    await delay();
    const idx = notifications.findIndex((n) => n._id === id);
    if (idx === -1) return null;
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

  // ==================== INVENTORY APIs ====================
  async getInventory(search?: string, bloodType?: string, status?: string) {
    try {
      const queryParams: any = {};
      if (search) queryParams.search = search;
      if (bloodType && bloodType !== 'All') queryParams.bloodType = bloodType;
      if (status && status !== 'All') queryParams.status = status;

      const res = await apiClient.get('/bc/inventory', { params: queryParams });
      const rawData = res.data?.data || res.data;
      if (Array.isArray(rawData) && rawData.length > 0) {
        return rawData as BloodBagData[];
      }
    } catch (err) {
      console.warn('[apiService] Backend getInventory failed, using fallback:', err);
    }

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
    try {
      const res = await apiClient.get(`/bc/inventory/${id}`);
      if (res.data) return res.data as BloodBagData;
    } catch (err) {
      console.warn('[apiService] Backend getBloodBagById failed, using fallback:', err);
    }

    await delay();
    return bloodBags.find((b) => b._id === id) || null;
  },

  async updateBloodBagStatus(id: string, newStatus: BloodBagData['status'], reason?: string) {
    try {
      const res = await apiClient.put(`/bc/inventory/${id}/status`, { status: newStatus, reason: reason || 'Cập nhật trạng thái' });
      if (res.data) return res.data as BloodBagData;
    } catch (err) {
      console.warn('[apiService] Backend updateBloodBagStatus failed, using fallback:', err);
    }

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
      statusHistory: [historyEntry, ...(bloodBags[idx].statusHistory || [])],
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
    try {
      const res = await apiClient.post('/bc/inventory/stock-in', { entries });
      if (res.data) return res.data;
    } catch (err) {
      console.warn('[apiService] Backend stockIn failed, using fallback:', err);
    }

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
    try {
      const res = await apiClient.post('/bc/inventory/stock-out', { bagIds, reason, notes });
      if (res.status === 200) return true;
    } catch (err) {
      console.warn('[apiService] Backend stockOut failed, using fallback:', err);
    }

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
            ...(b.statusHistory || []),
          ],
        };
      }
      return b;
    });
    return true;
  },

  async getInventoryStatistics() {
    try {
      const res = await apiClient.get('/bc/inventory/statistics');
      if (res.data) return res.data;
    } catch (err) {
      console.warn('[apiService] Backend getInventoryStatistics failed, using fallback:', err);
    }

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
