import type { Appointment, ApiResponse } from '../types';

// Mock data for appointments
const mockAppointments: Appointment[] = [
  {
    id: 'A-1234',
    date: '2024-10-25',
    time: '09:00 - 10:00',
    location: {
      id: 'L-1',
      name: 'Cho Ray Hospital',
      address: '201B Nguyen Chi Thanh, Ward 12, District 5, HCMC'
    },
    bloodType: 'O+',
    status: 'upcoming',
    qrCodeUrl: 'mock-qr-code',
    healthSummary: {
      bloodPressure: '120/80',
      heartRate: '72 bpm',
      weight: '65 kg'
    }
  },
  {
    id: 'A-5678',
    date: '2024-05-12',
    time: '14:00 - 15:00',
    location: {
      id: 'L-2',
      name: 'Blood Transfusion Hematology Hospital',
      address: '118 Hong Bang, Ward 12, District 5, HCMC'
    },
    bloodType: 'O+',
    status: 'completed',
    qrCodeUrl: 'mock-qr-code',
    healthSummary: {
      bloodPressure: '118/75',
      heartRate: '75 bpm',
      weight: '64.5 kg',
      hemoglobin: '14.2 g/dL'
    }
  },
  {
    id: 'A-9012',
    date: '2024-01-10',
    time: '08:00 - 09:00',
    location: {
      id: 'L-3',
      name: 'Tu Du Hospital',
      address: '284 Cong Quynh, Pham Ngu Lao Ward, District 1, HCMC'
    },
    status: 'cancelled',
    healthSummary: {}
  }
];

export const fetchAppointments = async (): Promise<ApiResponse<Appointment[]>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockAppointments
      });
    }, 800);
  });
};

export const cancelAppointment = async (id: string): Promise<ApiResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock Error AF-03 System Error on Cancellation if ID is 'error'
      if (id === 'error') {
        resolve({
          success: false,
          message: 'System Error. Please try again later.'
        });
        return;
      }
      
      // Mock Error AF-02 Cancellation Deadline Passed if ID is 'passed'
      if (id === 'passed') {
        resolve({
          success: false,
          message: 'Cancellation deadline passed.'
        });
        return;
      }
      
      resolve({
        success: true,
        message: 'Appointment cancelled successfully.'
      });
    }, 1000);
  });
};

export const downloadETicket = async (id: string): Promise<ApiResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (id === 'error') {
        resolve({
          success: false,
          message: 'Failed to generate E-Ticket.'
        });
      } else {
        resolve({
          success: true,
          message: 'E-Ticket downloaded successfully.'
        });
      }
    }, 1200);
  });
};
