import { apiClient } from '../../../shared/api/apiClient';
import { apiService } from '../../../services/apiClient';

export type SOSUrgency = 'Critical' | 'High' | 'Medium';
export type SOSStatus = 'Pending' | 'EvaluationInProgress' | 'NotificationsDispatched' | 'InventoryDispatched' | 'Fulfilled' | 'Expired' | 'Cancelled' | 'EvaluationFailed';

export interface SOSRequest {
  id: string;
  hospitalId: string;
  createdByStaffId: string;
  bloodType: string;
  requiredQuantityMl: number;
  collectedQuantityMl?: number;
  acceptedDonorIds?: string[];
  urgencyLevel: SOSUrgency;
  patientReference?: string;
  fulfillmentDeadline: string;
  status: SOSStatus;
  createdAt: string;
  updatedAt: string;
  hospital?: {
    _id: string;
    name: string;
    address: string;
    contactPhone?: string;
    location?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSOSRequestPayload {
  hospitalId: string;
  bloodType: string;
  requiredQuantityMl: number;
  urgencyLevel: SOSUrgency;
  patientReference?: string;
  fulfillmentDeadline: string;
}

export interface HospitalInfo {
  _id: string;
  name: string;
  address: string;
  location: {
    type: string;
    coordinates: number[];
  };
  contactPhone: string;
}

export interface UpdateSOSStatusPayload {
  status: SOSStatus;
}

export interface SOSQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  urgencyLevel?: string;
}

export interface SOSEvaluationLog {
  sosRequestId: string;
  rankedBloodCenters: Array<{
    centerId: string;
    score: number;
    inventoryVolume: number;
    distanceKm: number;
  }>;
  rankedDonors: Array<{
    donorId: string;
    score: number;
    distanceKm: number;
    lastDonationDate?: string;
    engagementTier: number;
  }>;
  searchRadiusKmUsed: number;
  radiusExpansionCount: number;
  notificationDeliveryStats: Record<string, any>;
  evaluatedAt: string;
  immutable: boolean;
}

export const sosApi = {
  async getHospitals(): Promise<HospitalInfo[]> {
    return await apiService.getHospitals();
  },

  async createSOSRequest(payload: CreateSOSRequestPayload): Promise<SOSRequest> {
    const response = await apiClient.post('/hospital/sos-requests', payload);
    return response.data;
  },

  async getSOSRequests(params?: SOSQueryParams): Promise<PaginatedResponse<SOSRequest>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.status) queryParams.append('status', params.status);
    if (params?.urgencyLevel) queryParams.append('urgencyLevel', params.urgencyLevel);

    const response = await apiClient.get(`/hospital/sos-requests?${queryParams.toString()}`);
    return response.data;
  },

  async getSOSRequestById(id: string): Promise<SOSRequest> {
    const response = await apiClient.get(`/hospital/sos-requests/${id}`);
    return response.data;
  },

  async updateSOSRequestStatus(id: string, payload: UpdateSOSStatusPayload): Promise<SOSRequest> {
    const response = await apiClient.patch(`/hospital/sos-requests/${id}/status`, payload);
    return response.data;
  },

  async getEvaluationLog(id: string): Promise<SOSEvaluationLog | null> {
    try {
      const response = await apiClient.get(`/hospital/sos-requests/${id}/evaluation-log`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async respondToSOS(id: string, accept: boolean): Promise<any> {
    const response = await apiClient.post(`/hospital/sos-requests/${id}/respond`, { 
      response: accept ? 'accepted' : 'declined' 
    });
    return response.data;
  },

  async reopenSOSRequest(id: string, cancelledDonorId: string): Promise<any> {
    const response = await apiClient.post(`/hospital/sos-requests/${id}/reopen`, { cancelledDonorId });
    return response.data;
  },

  async fulfillFromInventory(id: string, bagIds: string[]): Promise<any> {
    const response = await apiClient.post(`/hospital/sos-requests/${id}/fulfill-from-inventory`, { bagIds });
    return response.data;
  },

  async confirmReceived(id: string): Promise<any> {
    const response = await apiClient.patch(`/hospital/sos-requests/${id}/confirm-received`, {});
    return response.data;
  }
};