export interface LoginCredentials {
  idDocumentNumber: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
  role?: string;
}

export interface AuthUser {
  id?: string;
  _id?: string;
  email: string;
  fullName: string;
  role: 'donor' | 'staff' | 'hospital' | 'admin' | string;
  roles?: Array<'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator' | string>;
  avatarUrl?: string;
  idDocumentNumber?: string;
  hospitalId?: string;
  hospitalName?: string;
  bloodCenterId?: string;
  donorProfileId?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOTPPayload {
  email: string;
  code: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword?: string;
}
