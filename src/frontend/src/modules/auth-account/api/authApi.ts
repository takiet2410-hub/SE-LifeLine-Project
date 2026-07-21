import axios from 'axios';
import type { LoginCredentials, AuthResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const authApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  // Mock login for testing
  if (credentials.email === 'test@lifeline.org' && credentials.password === 'LifeLine@2026!') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Login successful',
          token: 'mock-jwt-token',
          user: {
            id: '1',
            email: 'test@lifeline.org',
            fullName: 'Test User',
            role: 'donor'
          }
        });
      }, 1000);
    });
  }

  try {
    const response = await authApiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      message: 'Network error or server is unavailable. Please try again later.',
    };
  }
};

export const sendOTP = async (
  payload: { email: string }
): Promise<AuthResponse> => {
  // Mock API call using payload to prevent TS6133
  console.log('Sending OTP to', payload.email);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'OTP has been sent to your email.',
      });
    }, 1000);
  });
};

export const verifyOTP = async (
  payload: { email: string; code: string }
): Promise<AuthResponse> => {
  // Mock API call
  return new Promise((resolve) => {
    setTimeout(() => {
      if (payload.code === '123456') {
        resolve({ success: true });
      } else if (payload.code === '000000') {
        resolve({ success: false, message: 'OTP Expired' });
      } else {
        resolve({ success: false, message: 'Invalid OTP code' });
      }
    }, 1000);
  });
};

export const resetPassword = async (
  payload: import('../types').ResetPasswordPayload
): Promise<AuthResponse> => {
  // Mock API call using payload to prevent TS6133
  console.log('Resetting password for', payload.email);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Password has been reset successfully.',
      });
    }, 1000);
  });
};
