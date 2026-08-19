import { apiClient } from '../../../shared/api/apiClient';
import type {
  UserListResponse,
  RoleItem,
  AuditLogItem,
  ConfigCategoryGroup,
  FeatureToggleItem,
  DiagnosticsResponse,
  DashboardMetricsResponse,
  CreateAdminUserInput,
  UpdateAdminUserInput,
  UserItem,
  StaffOrganizationOption,
} from '../types/admin.types';

type AdminQueryParams = Record<string, string | number | boolean | undefined>;

export const adminApi = {
  // AD-UC-01 & AD-UC-02: Users
  getUsers: async (params?: AdminQueryParams): Promise<UserListResponse> => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },

  getUserById: async (userId: string): Promise<UserItem> => {
    const res = await apiClient.get<{ user: UserItem }>(`/admin/users/${userId}`);
    return res.data.user;
  },

  exportUsersCsv: async (params?: AdminQueryParams): Promise<Blob> => {
    const res = await apiClient.get('/admin/users/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },

  createUser: async (data: CreateAdminUserInput) => {
    const res = await apiClient.post('/admin/users', data);
    return res.data;
  },

  updateUser: async (userId: string, data: UpdateAdminUserInput) => {
    const res = await apiClient.put(`/admin/users/${userId}`, data);
    return res.data;
  },

  softDeleteUser: async (userId: string, reason: string, confirmationUsername: string) => {
    const res = await apiClient.delete(`/admin/users/${userId}`, {
      data: { reason, confirmationUsername },
    });
    return res.data;
  },

  getHospitals: async (): Promise<StaffOrganizationOption[]> => {
    const res = await apiClient.get('/users/admin/hospitals');
    return res.data?.data || [];
  },

  getBloodCenters: async (): Promise<StaffOrganizationOption[]> => {
    const res = await apiClient.get('/users/admin/blood-centers');
    return res.data?.data || [];
  },

  restoreUser: async (userId: string, confirmationUsername: string) => {
    const res = await apiClient.post(`/admin/users/${userId}/restore`, { confirmationUsername });
    return res.data;
  },

  purgePersonalData: async (userId: string, reason: string, confirmationUsername: string, adminPassword: string) => {
    const res = await apiClient.post(`/admin/users/${userId}/purge-personal-data`, {
      reason,
      confirmationUsername,
      adminPassword,
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

  getActivityLogs: async (params?: AdminQueryParams): Promise<{
    items: AuditLogItem[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> => {
    const res = await apiClient.get('/admin/logs', { params });
    return res.data;
  },

  exportLogsCsv: async (params?: AdminQueryParams): Promise<Blob> => {
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

  updateConfig: async (key: string, value: unknown) => {
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
