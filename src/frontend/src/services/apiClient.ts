import type {
  CampaignData,
  RegistrationData,
  ArticleData,
  BloodBagData,
  NotificationData,
  NotificationPreference,
} from './mockData';
import {
  initialCampaigns,
  initialRegistrations,
  initialArticles,
  initialNotifications,
  initialBloodBags,
} from './mockData';
import { apiClient } from '../shared/api/apiClient';
import { notifyNotificationsChanged } from '../utils/notificationEvents';

// Local in-memory fallbacks
let campaigns = [...initialCampaigns];
let registrations = [...initialRegistrations];
let articles = [...initialArticles];
let notifications = [...initialNotifications];
let bloodBags = [...initialBloodBags];

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiService = {


  // ==================== NOTIFICATION APIs ====================
  async getNotifications(params?: { type?: string; status?: string; page?: number; limit?: number }) {
    const queryParams: any = {};
    if (params?.type && params.type !== 'All') queryParams.type = params.type;
    if (params?.status && params.status !== 'All') queryParams.status = params.status.toLowerCase();
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    try {
      const res = await apiClient.get('/notifications', { params: queryParams });
      const rawData = res.data?.data || res.data;
      const pagination = res.data?.pagination;
      if (Array.isArray(rawData) && rawData.length > 0) {
        return {
          data: rawData as NotificationData[],
          totalPages: pagination?.totalPages || 1,
          total: pagination?.total || rawData.length,
        };
      }
    } catch (err) {
      console.warn('[apiService] Backend getNotifications failed, using local notifications fallback:', err);
    }

    let filtered = [...notifications];
    if (params?.type && params.type !== 'All') {
      filtered = filtered.filter(n => n.type === params.type);
    }
    if (params?.status && params.status !== 'All') {
      const isUnread = params.status.toLowerCase() === 'unread';
      filtered = filtered.filter(n => isUnread ? !n.readAt : !!n.readAt);
    }
    return {
      data: filtered as NotificationData[],
      totalPages: 1,
      total: filtered.length,
    };
  },

  async getNotificationById(id: string) {
    try {
      const res = await apiClient.get(`/notifications/${id}`);
      const rawData = res.data?.data || res.data;
      if (rawData) return rawData as NotificationData;
    } catch (err) {
      console.warn('[apiService] Backend getNotificationById failed, using local fallback:', err);
    }
    return notifications.find((n) => n._id === id) || null;
  },

  async markNotificationAsRead(id: string) {
    try {
      const res = await apiClient.patch(`/notifications/${id}/read`);
      const rawData = res.data?.data || res.data;
      notifyNotificationsChanged();
      if (rawData) return rawData as NotificationData;
    } catch (err) {
      console.warn('[apiService] Backend markNotificationAsRead failed, using local fallback:', err);
    }
    notifications = notifications.map((n) => n._id === id ? { ...n, readAt: new Date().toISOString() } : n);
    notifyNotificationsChanged();
    return notifications.find((n) => n._id === id) || null;
  },

  async respondToSOS(notificationId: string, response: 'accepted' | 'declined') {
    try {
      const res = await apiClient.patch(`/notifications/${notificationId}/sos-response`, { response });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('[apiService] Backend respondToSOS failed:', err);
      throw err;
    }
  },

  async markMultipleNotificationsAsRead(ids: string[]) {
    try {
      // If no ids passed, mark all unread as read
      const body = ids.length > 0 ? { ids } : { markAllAsRead: true };
      const res = await apiClient.patch('/notifications/read-all', body);
      notifyNotificationsChanged();
      return res.data;
    } catch (err) {
      console.warn('[apiService] Backend markMultipleNotificationsAsRead failed, using fallback:', err);
    }

    await delay();
    notifications = notifications.map((n) =>
      ids.includes(n._id) ? { ...n, readAt: new Date().toISOString() } : n
    );
    notifyNotificationsChanged();
    return { modifiedCount: ids.length };
  },

  async removeNotification(id: string) {
    try {
      await apiClient.delete(`/notifications/${id}`);
      notifyNotificationsChanged();
    } catch (err) {
      console.warn('[apiService] Backend removeNotification failed, using fallback:', err);
    }

    await delay();
    notifications = notifications.filter((n) => n._id !== id);
    notifyNotificationsChanged();
  },

  async getUnreadCount() {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      return res.data?.count || 0;
    } catch (err) {
      console.warn('[apiService] Backend getUnreadCount failed, using fallback:', err);
    }

    await delay();
    return notifications.filter((n) => n.readAt === null).length;
  },

  async getNotificationPreferences() {
    try {
      const res = await apiClient.get('/notifications/preferences');
      return (res.data?.data || res.data) as NotificationPreference;
    } catch (err) {
      console.warn('[apiService] Backend getNotificationPreferences failed, using fallback:', err);
    }

    await delay();
    return {
      sosEnabled: true,
      appointmentEnabled: true,
      campaignEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: 'Asia/Ho_Chi_Minh',
    };
  },

  async updateNotificationPreferences(prefs: Partial<NotificationPreference>) {
    try {
      const res = await apiClient.patch('/notifications/preferences', prefs);
      return (res.data?.data || res.data) as NotificationPreference;
    } catch (err) {
      console.warn('[apiService] Backend updateNotificationPreferences failed, using fallback:', err);
    }

    await delay();
    return {
      sosEnabled: true,
      appointmentEnabled: true,
      campaignEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: 'Asia/Ho_Chi_Minh',
    };
  },

  // ==================== CAMPAIGN APIs ====================
  async getCampaigns(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    try {
      const queryParams: any = {};
      if (params?.search) queryParams.location = params.search;
      if (params?.status && params.status !== 'All') {
        queryParams.status = params.status;
      }
      queryParams.page = params?.page || 1;
      queryParams.limit = params?.limit || 20;
      queryParams.sortBy = 'startDateTime';
      queryParams.sortOrder = 'desc';

      const res = await apiClient.get('/campaigns', { params: queryParams });
      
      // If backend returns pagination and stats, pass them through
      if (res.data && res.data.pagination) {
        return {
          data: res.data.data as CampaignData[],
          pagination: res.data.pagination,
          stats: res.data.stats
        };
      }
      
      let rawData = res.data?.data || res.data;
      if (Array.isArray(rawData) && rawData.length > 0) {
        if (!params?.status || params.status === 'All') {
          rawData = rawData.filter((c: any) => c.status !== 'Cancelled');
        }
        return { data: rawData as CampaignData[] };
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
    return { data: result };
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

  async createCampaign(data: any) {
    try {
      const normalizedBloodGroups = (data.targetBloodGroups || []).map((bg: string) =>
        bg === 'All Types' ? 'ALL TYPES' : bg
      );

      const payload = {
        name: data.name,
        description: data.description || data.name,
        venue: data.venue,
        fullAddress: data.fullAddress || data.venue,
        startDate: data.startDate || data.startDateTime,
        startDateTime: data.startDateTime || data.startDate,
        endDate: data.endDate || data.endDateTime || data.startDate || data.startDateTime,
        endDateTime: data.endDateTime || data.endDate || data.startDate || data.startDateTime,
        targetBloodGroups: normalizedBloodGroups.length > 0 ? normalizedBloodGroups : ['ALL TYPES'],
        capacity: Number(data.capacity) || 100,
        targetUnitsGoal: Number(data.targetUnitsGoal) || (data.capacity ? Math.round(Number(data.capacity) * 0.8) : 80),
        contactPerson: data.contactPerson && data.contactPerson.name ? data.contactPerson : { name: 'Cán bộ Kho máu', phone: '0909123456' },
        timeslots: data.timeslots,
        dailyTimeslots: data.dailyTimeslots,
        status: data.status || 'Upcoming',
        isDraft: data.isDraft,
        ...(data.bloodCenterId && /^[0-9a-fA-F]{24}$/.test(data.bloodCenterId) ? { bloodCenterId: data.bloodCenterId } : {}),
      };

      const res = await apiClient.post('/campaigns', payload);
      if (res.data) {
        return res.data as CampaignData;
      }
    } catch (err) {
      console.warn('[apiService] Backend createCampaign failed, using fallback:', err);
      throw err;
    }

    await delay();
    const newCampaign: CampaignData = {
      ...data,
      startDateTime: data.startDate || data.startDateTime || new Date().toISOString(),
      endDateTime: data.endDate || data.endDateTime || new Date().toISOString(),
      location: data.location || { type: 'Point', coordinates: [106.660172, 10.755498] },
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
            timeSlot: item.timeSlot || item.appointmentTime || item.appointmentId?.timeSlot || '',
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

        const rawDob = item.donorDob || donorObj.dateOfBirth || item.donor?.dateOfBirth || item.donorId?.dateOfBirth || '';
        let donorDob = rawDob ? String(rawDob).split('T')[0].split(' ')[0] : '15/08/1995';
        if (donorDob.includes('-')) {
          const parts = donorDob.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            donorDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }

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
          timeSlot: item.timeSlot || item.appointmentTime || item.appointmentId?.timeSlot || '',
          status: item.status || 'CheckedIn',
          bloodPressure: screeningObj?.vitals?.bloodPressure || item.bloodPressure || '',
          weight: screeningObj?.vitals?.weight || item.weight || undefined,
          bodyTemperature: screeningObj?.vitals?.bodyTemperature || item.bodyTemperature || undefined,
          hemoglobinLevel: screeningObj?.vitals?.hemoglobinLevel || item.hemoglobinLevel || undefined,
          screeningNotes: screeningObj?.screeningNotes || item.screeningNotes || '',
          donationVolume: item.donationVolume || screeningObj?.donationVolume || 350,
          donationHistory: item.donationHistory || [],
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
      if (updates.donationVolume !== undefined) {
        payload.donationVolume = Number(updates.donationVolume);
      }
      if ((updates as any).testResult !== undefined) {
        payload.testResult = (updates as any).testResult;
      }
      if (updates.donorBloodType && updates.donorBloodType !== 'Unknown') {
        payload.bloodType = updates.donorBloodType;
      } else if ((updates as any).bloodType) {
        payload.bloodType = (updates as any).bloodType;
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
      if (registrations[0].status === 'Confirmed' || registrations[0].status === 'Pending') {
        registrations[0].status = 'CheckedIn';
      }
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

  // ==================== HOSPITAL APIs ====================
  async getHospitals() {
    try {
      const res = await apiClient.get('/hospitals');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        return data;
      }
    } catch (err) {
      console.warn('[apiService] Backend getHospitals failed, using fallback:', err);
    }
    
    // Fallback Mock Data
    await delay();
    return [
      {
        _id: '60d21b4667d0d8992e610c86',
        name: 'Bệnh viện Chợ Rẫy (MOCK DATA)',
        address: '201B Nguyễn Chí Thanh, Quận 5, TP.HCM',
        location: { type: 'Point', coordinates: [106.659616, 10.757826] },
        contactPhone: '02838554137',
        isVerified: true
      },
      {
        _id: '60d21b4667d0d8992e610c99',
        name: 'Bệnh viện Truyền máu Huyết học (MOCK DATA)',
        address: '118 Hồng Bàng, Phường 12, Quận 5, TP.HCM',
        location: { type: 'Point', coordinates: [106.662700, 10.755490] },
        contactPhone: '02839571342',
        isVerified: true
      }
    ];
  },
};
