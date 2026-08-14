import { apiClient } from '../shared/api/apiClient';
import { notifyNotificationsChanged } from '../utils/notificationEvents';


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
      if (Array.isArray(rawData)) {
        return {
          data: rawData as NotificationData[],
          totalPages: pagination?.totalPages || 1,
          total: pagination?.total || rawData.length,
        };
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async getNotificationById(id: string) {
    try {
      const res = await apiClient.get(`/notifications/${id}`);
      const rawData = res.data?.data || res.data;
      if (rawData) return rawData as NotificationData;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async markNotificationAsRead(id: string) {
    try {
      const res = await apiClient.patch(`/notifications/${id}/read`);
      const rawData = res.data?.data || res.data;
      notifyNotificationsChanged();
      if (rawData) return rawData as NotificationData;
    } catch (err) {
      console.error(err);
      throw err;
    }
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
      console.error(err);
      throw err;
    }
  },

  async removeNotification(id: string) {
    try {
      await apiClient.delete(`/notifications/${id}`);
      notifyNotificationsChanged();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async getUnreadCount() {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      return res.data?.count || 0;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async getNotificationPreferences() {
    try {
      const res = await apiClient.get('/notifications/preferences');
      return (res.data?.data || res.data) as NotificationPreference;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async updateNotificationPreferences(prefs: Partial<NotificationPreference>) {
    try {
      const res = await apiClient.patch('/notifications/preferences', prefs);
      return (res.data?.data || res.data) as NotificationPreference;
    } catch (err) {
      console.error(err);
      throw err;
    }
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
      if (Array.isArray(rawData)) {
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
      console.error(err);
      throw err;
    }
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
      console.error(err);
      throw err;
    }
  },

  async updateCampaign(id: string, updates: Partial<CampaignData>) {
    try {
      const res = await apiClient.put(`/campaigns/${id}`, updates);
      if (res.data) {
        return res.data as CampaignData;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
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
      console.error(err);
      throw err;
    }
  },

  async checkInQRCode(qrPayload: string) {
    try {
      const res = await apiClient.post('/registrations/qr-checkin', { qrPayload });
      if (res.data) {
        return res.data;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // ==================== ARTICLE APIs ====================
  async getArticles(category?: string, status?: string) {
    try {
      const queryParams: any = {};
      if (category && category !== 'All') queryParams.category = category;
      if (status && status !== 'All') queryParams.status = status;

      const res = await apiClient.get('/bc/articles', { params: queryParams });
      const rawData = res.data?.data || res.data;
      if (Array.isArray(rawData)) {
        return rawData as ArticleData[];
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async getArticleById(id: string) {
    try {
      const res = await apiClient.get(`/bc/articles/${id}`);
      if (res.data) {
        return res.data as ArticleData;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async createArticle(data: Omit<ArticleData, '_id' | 'createdAt' | 'authorStaffId' | 'authorName'>) {
    try {
      const res = await apiClient.post('/bc/articles', data);
      if (res.data) return res.data as ArticleData;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async updateArticle(id: string, updates: Partial<ArticleData>) {
    try {
      const res = await apiClient.put(`/bc/articles/${id}`, updates);
      if (res.data) return res.data as ArticleData;
    } catch (err) {
      console.error(err);
      throw err;
    }
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
      if (Array.isArray(rawData)) {
        return rawData as BloodBagData[];
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async getBloodBagById(id: string) {
    try {
      const res = await apiClient.get(`/bc/inventory/${id}`);
      if (res.data) return res.data as BloodBagData;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async updateBloodBagStatus(id: string, newStatus: BloodBagData['status'], reason?: string) {
    try {
      const res = await apiClient.put(`/bc/inventory/${id}/status`, { status: newStatus, reason: reason || 'Cập nhật trạng thái' });
      if (res.data) return res.data as BloodBagData;
    } catch (err) {
      console.error(err);
      throw err;
    }
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
      console.error(err);
      throw err;
    }
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
      console.error(err);
      throw err;
    }
  },

  async getInventoryStatistics() {
    try {
      const res = await apiClient.get('/bc/inventory/statistics');
      if (res.data) return res.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
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
      console.error(err);
      throw err;
    }
  },
};
