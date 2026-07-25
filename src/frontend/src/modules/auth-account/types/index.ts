export interface LoginCredentials {
  idDocumentNumber: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'donor' | 'staff' | 'hospital' | 'admin' | string;
  avatarUrl?: string;
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
