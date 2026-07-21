import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
});

export type RegisterCitizenIdPayload = {
  fullName: string;
  dateOfBirth: string;
  idNumber: string;
  email: string;
  phoneNumber: string;
  password: string;
  cccdImage: File;
};

export async function registerCitizenId(payload: RegisterCitizenIdPayload) {
  const formData = new FormData();

  formData.append('fullName', payload.fullName);
  formData.append('dateOfBirth', payload.dateOfBirth);
  formData.append('idNumber', payload.idNumber);
  formData.append('email', payload.email);
  formData.append('phoneNumber', payload.phoneNumber);
  formData.append('password', payload.password);
  formData.append('cccdImage', payload.cccdImage);

  const response = await api.post('/auth/register-citizen-id', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data as { message?: string };
}

export async function verifyEmail(token: string) {
  const response = await api.post('/auth/verify-email', { token });

  return response.data as { message?: string };
}