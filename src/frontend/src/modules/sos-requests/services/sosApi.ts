import { apiClient } from '../../../shared/api/apiClient';
import { apiService } from '../../../services/apiClient';

export type SOSUrgency = 'Critical' | 'High' | 'Medium';
export type SOSStatus = 'Pending' | 'EvaluationInProgress' | 'NotificationsDispatched' | 'InventoryDispatched' | 'Fulfilled' | 'Expired' | 'Cancelled' | 'EvaluationFailed';

export interface SOSShipment {
  _id?: string;
  id?: string;
  shipmentCode: string;
  bloodCenterId?: string;
  bloodCenterName?: string;
  dispatchedByStaffId: string;
  dispatchedStaffName?: string;
  bloodBagIds: string[];
  volumeMl: number;
  bloodType: string;
  dispatchedAt: string;
  status: 'InTransit' | 'Received' | 'Cancelled';
  receivedAt?: string;
  receivedByStaffId?: string;
}

export interface DirectDonation {
  _id?: string;
  id?: string;
  donorId?: string;
  donorName: string;
  idDocumentNumber?: string;
  donorPhone?: string;
  bloodType?: string;
  fastTrackCode?: string;
  volumeMl: number;
  recordedAt: string;
  recordedByStaffId: string;
  note?: string;
}

export interface SOSRequest {
  id: string;
  hospitalId: string;
  createdByStaffId: string;
  bloodType: string;
  requiredQuantityMl: number;
  pledgedQuantityMl?: number;
  collectedQuantityMl?: number;
  receivedQuantityMl?: number;
  inTransitQuantityMl?: number;
  shipments?: SOSShipment[];
  directDonations?: DirectDonation[];
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
  bloodType?: string;
  search?: string;
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
    const data = await apiService.getHospitals();
    return data || [];
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
    if (params?.bloodType) queryParams.append('bloodType', params.bloodType);
    if (params?.search) queryParams.append('search', params.search);

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
  },

  async confirmShipmentReceived(id: string, shipmentId: string): Promise<any> {
    const response = await apiClient.patch(`/hospital/sos-requests/${id}/shipments/${shipmentId}/confirm-received`, {});
    return response.data;
  },

  async recordDirectDonation(id: string, payload: {
    volumeMl: number;
    fastTrackCode?: string;
    donorId?: string;
    donorName: string;
    idDocumentNumber?: string;
    donorPhone?: string;
    bloodType?: string;
    note?: string;
  }): Promise<any> {
    const response = await apiClient.post(`/hospital/sos-requests/${id}/direct-donations`, payload);
    return response.data;
  },

  async lookupDonor(id: string, query: string): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get(`/hospital/sos-requests/${id}/lookup-donor?query=${encodeURIComponent(query)}`);
    return response.data;
  }
};
