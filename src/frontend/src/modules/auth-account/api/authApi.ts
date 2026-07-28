import { apiClient } from '../../../shared/api/apiClient';
import type { LoginCredentials, AuthResponse, ResetPasswordPayload, AuthUser } from '../types';

const mapProfileResponseToAuthUser = (
  loginData: any,
  profileData: any
): AuthUser => {
  const role = profileData?.role || loginData.user?.role || 'Donor';
  const isStaff =
    role === 'BloodCenterStaff' ||
    role === 'HospitalStaff' ||
    role === 'Administrator' ||
    role.toLowerCase().includes('staff') ||
    role.toLowerCase().includes('admin');

  return {
    id: loginData.user?.id || loginData.user?._id || profileData?.id || '',
    email: loginData.user?.email || profileData?.contactInfo?.email || '',
    fullName:
      profileData?.profileInfo?.fullName ||
      profileData?.fullName ||
      loginData.user?.fullName ||
      (isStaff ? `Cán bộ ${role}` : 'Người hiến máu'),
    role,
  };
};

export const loginUser = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/users/login', {
      idDocumentNumber: credentials.idDocumentNumber,
      password: credentials.password,
    });

    if (response.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);

      const userRole = response.data.user?.role || 'Donor';
      const isStaff =
        userRole === 'BloodCenterStaff' ||
        userRole === 'HospitalStaff' ||
        userRole === 'Administrator' ||
        userRole.toLowerCase().includes('staff') ||
        userRole.toLowerCase().includes('admin');

      let user: AuthUser = {
        id: response.data.user?.id || response.data.user?._id || '',
        email: response.data.user?.email || credentials.idDocumentNumber,
        fullName: isStaff ? `Cán bộ ${userRole}` : 'Người hiến máu',
        role: userRole,
      };

      try {
        const profileResponse = await apiClient.get('/users/profile');
        if (profileResponse.data) {
          user = mapProfileResponseToAuthUser(response.data, profileResponse.data);
        }
      } catch (profileErr) {
        console.warn('[authApi] Profile fetch note:', profileErr);
      }

      localStorage.setItem('user', JSON.stringify(user));

      return {
        success: true,
        message: response.data.message || 'Login successful',
        token: response.data.accessToken,
        user,
      };
    }

    return {
      success: false,
      message: response.data?.message || 'Login failed. Invalid response from server.',
    };
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Invalid login credentials.',
      };
    }
    return {
      success: false,
      message: 'Network error. Could not connect to backend server.',
    };
  }
};

export const getProfile = async (): Promise<{ success: boolean; message?: string; user?: any }> => {
  try {
    const response = await apiClient.get('/users/profile');
    return {
      success: true,
      user: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch profile.',
    };
  }
};

export const sendOTP = async (
  payload: { idDocumentNumber: string; email: string }
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/users/forgot-password', {
      idDocumentNumber: payload.idDocumentNumber,
      email: payload.email,
    });
    return {
      success: true,
      message: response.data.message || 'OTP has been sent to your email.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send OTP.',
    };
  }
};

export const resendOTP = async (
  payload: { idDocumentNumber: string; email: string }
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/users/resend-forgot-password', {
      idDocumentNumber: payload.idDocumentNumber,
      email: payload.email,
    });
    return {
      success: true,
      message: response.data.message || 'OTP has been resent to your email.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to resend OTP.',
    };
  }
};

export const verifyOTP = async (
  payload: { email: string; code: string }
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/users/verify-reset-otp', {
      email: payload.email,
      otp: payload.code,
    });
    if (response.data?.token) {
      localStorage.setItem('resetToken', response.data.token);
    }
    return { success: true, message: response.data?.message || 'OTP verified' };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Invalid or expired OTP code',
    };
  }
};

export const resetPassword = async (
  payload: ResetPasswordPayload
): Promise<AuthResponse> => {
  try {
    const resetToken = localStorage.getItem('resetToken');
    if (!resetToken) {
      return { success: false, message: 'Reset token not found. Please start over.' };
    }
    const response = await apiClient.post('/users/reset-password', {
      token: resetToken,
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword,
    });
    return {
      success: true,
      message: response.data.message || 'Password has been reset successfully.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to reset password.',
    };
  }
};

export const updateUserProfile = async (payload: {
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}): Promise<AuthResponse> => {
  try {
    const response = await apiClient.patch('/users/profile', payload);
    return {
      success: true,
      message: response.data.message || 'Profile updated successfully',
      user: response.data.profile,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update profile.',
    };
  }
};

export const updateProfile = async (data: any): Promise<AuthResponse> => {
  try {
    const response = await apiClient.patch('/users/profile', data);
    return {
      success: true,
      message: response.data?.message || 'Cập nhật thành công',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Cập nhật thất bại',
    };
  }
};