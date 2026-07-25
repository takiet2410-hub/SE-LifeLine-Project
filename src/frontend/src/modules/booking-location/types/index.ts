export type AppointmentStatus = 'all' | 'upcoming' | 'completed' | 'cancelled' | 'no-show';

export interface Location {
  id: string;
  name: string;
  address: string;
}

export interface Appointment {
  id: string;
  date: string; // e.g. "2024-10-25"
  time: string; // e.g. "09:00 - 10:00"
  location: Location;
  bloodType?: string;
  status: AppointmentStatus;
  healthSummary?: {
    bloodPressure?: string;
    heartRate?: string;
    weight?: string;
    hemoglobin?: string;
  };
  qrCodeUrl?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
