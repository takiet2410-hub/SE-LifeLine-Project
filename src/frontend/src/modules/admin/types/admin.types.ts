export interface UserItem {
  id: string;
  idDocumentNumber: string;
  email: string;
  fullName: string;
  phone: string;
  permanentAddress?: string;
  currentAddress?: string;
  hospitalId?: string;
  bloodCenterId?: string;
  role: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';
  roles?: ('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[];
  accountStatus: 'PendingVerification' | 'Active' | 'Suspended';
  createdAt: string;
  lastLoginAt?: string;
  isDeleted?: boolean;
  privacyPurgedAt?: string;
}

export interface CreateAdminUserInput {
  idDocumentNumber: string;
  email: string;
  fullName: string;
  phone?: string;
  password: string;
  role: UserItem['role'];
  roles: NonNullable<UserItem['roles']>;
  permanentAddress?: string;
  currentAddress?: string;
  hospitalId?: string;
  bloodCenterId?: string;
}

export interface UpdateAdminUserInput {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: UserItem['role'];
  roles?: NonNullable<UserItem['roles']>;
  accountStatus?: UserItem['accountStatus'];
  permanentAddress?: string;
  currentAddress?: string;
  hospitalId?: string;
  bloodCenterId?: string;
}

export interface StaffOrganizationOption {
  _id: string;
  name: string;
  address?: string;
}

export interface UserListResponse {
  items: UserItem[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RoleItem {
  id: string;
  name: string;
  description: string;
  isSystemProtected: boolean;
  permissions: string[];
  userCount: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  action: string;
  actionCategory: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  status: 'Success' | 'Failure';
  previousValue?: unknown;
  newValue?: unknown;
  details?: string;
}

export interface ConfigItem {
  id: string;
  key: string;
  label: string;
  value: unknown;
  description?: string;
  unit?: string;
}

export interface ConfigCategoryGroup {
  category: string;
  items: ConfigItem[];
}

export interface FeatureToggleItem {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  dependencies: string[];
  affectedServices: string[];
  updatedBy?: string;
  updatedAt?: string;
}

export interface DiagnosticServiceItem {
  name: string;
  type: string;
  status: 'Operational' | 'Degraded' | 'Down';
  latencyMs: string;
  details: string;
}

export interface DiagnosticsResponse {
  timestamp: string;
  overallStatus: string;
  services: DiagnosticServiceItem[];
}

export interface DashboardMetricsResponse {
  activeSessions: number;
  totalUsers: number;
  activeUsers: number;
  systemUptime: string;
  errorRate: string;
  newRegistrationsToday: number;
  usageTrends: Array<{ month: string; donors: number; campaigns: number }>;
}
