import { apiClient } from '../../../shared/api/apiClient';

export type RegisterCitizenIdPayload = {
  qrPayload: string;
  email: string;
  phoneNumber: string;
  password: string;
  currentAddress?: string;
};

export async function registerCitizenId(payload: RegisterCitizenIdPayload) {
  const response = await apiClient.post('/users/register', payload);
  return response.data as { message?: string };
}

export async function verifyEmail(token: string) {
  const response = await apiClient.post('/users/verify-email', { token });
  return response.data as { message?: string };
}