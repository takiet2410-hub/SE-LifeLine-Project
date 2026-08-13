import { apiClient } from '../../../shared/api/apiClient';
import type {
  UserListResponse,
  RoleItem,
  AuditLogItem,
  ConfigCategoryGroup,
  FeatureToggleItem,
  DiagnosticsResponse,
  DashboardMetricsResponse,
} from '../types/admin.types';

export const adminApi = {
  // AD-UC-01 & AD-UC-02: Users
  getUsers: async (params?: Record<string, any>): Promise<UserListResponse> => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },

  exportUsersCsvUrl: (params?: Record<string, any>): string => {
    const { token, ...rest } = params || {};
    const query = new URLSearchParams(rest).toString();
    const authToken = token || localStorage.getItem('accessToken') || '';
    return `${apiClient.defaults.baseURL}/admin/users/export?${query}&token=${authToken}`;
  },

  exportUsersCsv: async (params?: Record<string, any>): Promise<Blob> => {
    const res = await apiClient.get('/admin/users/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },

  createUser: async (data: any) => {
    const res = await apiClient.post('/admin/users', data);
    return res.data;
  },

  updateUser: async (userId: string, data: any) => {
    const res = await apiClient.put(`/admin/users/${userId}`, data);
    return res.data;
  },

  softDeleteUser: async (userId: string, reason: string, confirmationUsername: string) => {
    const res = await apiClient.delete(`/admin/users/${userId}`, {
      data: { reason, confirmationUsername },
    });
    return res.data;
  },

  // AD-UC-03: Roles
  getRoles: async (): Promise<{ roles: RoleItem[]; availablePermissions: string[] }> => {
    const res = await apiClient.get('/admin/roles');
    return res.data;
  },

  updateRolePermissions: async (roleId: string, permissions: string[]) => {
    const res = await apiClient.put(`/admin/roles/${roleId}/permissions`, { permissions });
    return res.data;
  },

  // AD-UC-04: Monitoring & Dashboard
  getDashboardMetrics: async (): Promise<DashboardMetricsResponse> => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },

  runDiagnostics: async (): Promise<DiagnosticsResponse> => {
    const res = await apiClient.post('/admin/diagnostics');
    return res.data;
  },

  getActivityLogs: async (params?: Record<string, any>): Promise<{ items: AuditLogItem[]; pagination: any }> => {
    const res = await apiClient.get('/admin/logs', { params });
    return res.data;
  },

  exportLogsCsvUrl: (params?: Record<string, any>): string => {
    const { token, ...rest } = params || {};
    const query = new URLSearchParams(rest).toString();
    const authToken = token || localStorage.getItem('accessToken') || '';
    return `${apiClient.defaults.baseURL}/admin/logs/export?${query}&token=${authToken}`;
  },

  exportLogsCsv: async (params?: Record<string, any>): Promise<Blob> => {
    const res = await apiClient.get('/admin/logs/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },

  // AD-UC-05: Configurations
  getConfigs: async (): Promise<{ categories: ConfigCategoryGroup[] }> => {
    const res = await apiClient.get('/admin/config');
    return res.data;
  },

  updateConfig: async (key: string, value: any) => {
    const res = await apiClient.put('/admin/config', { key, value });
    return res.data;
  },

  // AD-UC-06: Feature Toggles
  getToggles: async (): Promise<{ toggles: FeatureToggleItem[] }> => {
    const res = await apiClient.get('/admin/toggles');
    return res.data;
  },

  updateToggle: async (key: string, isEnabled: boolean) => {
    const res = await apiClient.put(`/admin/toggles/${key}`, { isEnabled });
    return res.data;
  },
};
