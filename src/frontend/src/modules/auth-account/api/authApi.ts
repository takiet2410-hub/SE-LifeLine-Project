import { apiClient } from '../../../shared/api/apiClient';
import type { LoginCredentials, AuthResponse, ResetPasswordPayload } from '../types';
import type { AuthUser } from '../../../shared/contexts/AuthContext';

// Add the AuthResponse type to include user info if not already there
export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
}

// BUG-06 FIX: BE /users/profile trả về cấu trúc lồng nhau, cần map đúng
// BE response shape:
//   { profileInfo: { fullName, avatarUrl, memberSince, ... }, personalInfo: { ... }, ... }
// BE /users/login trả về:
//   { accessToken, user: { id, email, idDocumentNumber } }
const mapProfileResponseToAuthUser = (
  loginData: any,
  profileData: any
): AuthUser => {
  return {
    id: loginData.user?.id || loginData.user?._id || '',
    email: loginData.user?.email || '',
    // fullName nằm trong profileInfo.fullName của GET /users/profile
    fullName: profileData?.profileInfo?.fullName
      || profileData?.fullName
      || loginData.user?.fullName
      || 'Donor User',
    // role nằm trong User collection, BE không trả về trong profile response
    // Fallback về 'donor' vì đây là Donor portal
    role: profileData?.role || loginData.user?.role || 'donor',
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
      
      // Fetch user profile để lấy fullName và thông tin đầy đủ
      try {
        const profileResponse = await apiClient.get('/users/profile');
        if (profileResponse.data) {
          const user = mapProfileResponseToAuthUser(response.data, profileResponse.data);
          localStorage.setItem('user', JSON.stringify(user));
          
          return {
            success: true,
            message: response.data.message || 'Login successful',
            token: response.data.accessToken,
            user,
          };
        }
      } catch (profileErr) {
        // Profile fetch thất bại → vẫn login thành công, dùng fallback
        console.warn('[authApi] Profile fetch after login failed:', profileErr);
      }
    }
    
    // Fallback nếu profile fetch thất bại hoặc không có accessToken
    const fallbackUser: AuthUser = {
      id: response.data.user?.id || response.data.userId || '',
      email: response.data.user?.email || credentials.idDocumentNumber,
      fullName: response.data.user?.fullName || 'Donor User',
      role: response.data.user?.role || 'donor',
    };
    localStorage.setItem('user', JSON.stringify(fallbackUser));
    return {
      success: true,
      message: response.data.message || 'Login successful',
      token: response.data.accessToken,
      user: fallbackUser,
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
      user: response.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch profile.'
    };
  }
};

// Keep the rest of the file unchanged
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
      message: response.data?.message || 'C?p nh?t th�nh c�ng'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'C?p nh?t th?t b?i'
    };
  }
};

