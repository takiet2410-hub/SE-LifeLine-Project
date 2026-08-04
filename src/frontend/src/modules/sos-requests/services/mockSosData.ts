export type SOSUrgency = 'Critical' | 'High' | 'Medium';
export type SOSStatus = 'Pending' | 'EvaluationInProgress' | 'NotificationsDispatched' | 'Fulfilled' | 'Expired' | 'Cancelled' | 'EvaluationFailed';

export interface SOSRequest {
  id: string;
  bloodType: string;
  quantity: number; // in ml
  urgency: SOSUrgency;
  status: SOSStatus;
  requestDate: string;
  patientName: string;
  patientCondition: string;
  hospitalName: string;
  fulfilledQuantity?: number;
}

export const MOCK_SOS_REQUESTS: SOSRequest[] = [
  {
    id: 'SOS-2023-0801',
    bloodType: 'O-',
    quantity: 1500,
    urgency: 'Critical',
    status: 'Pending',
    requestDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    patientName: 'Nguyen Van A',
    patientCondition: 'Emergency Surgery - Severe Trauma',
    hospitalName: 'Cho Ray Hospital',
    fulfilledQuantity: 0,
  },
  {
    id: 'SOS-2023-0802',
    bloodType: 'A+',
    quantity: 1000,
    urgency: 'High',
    status: 'EvaluationInProgress',
    requestDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    patientName: 'Tran Thi B',
    patientCondition: 'Maternity Complications',
    hospitalName: 'Tu Du Hospital',
    fulfilledQuantity: 0,
  },
  {
    id: 'SOS-2023-0803',
    bloodType: 'B-',
    quantity: 500,
    urgency: 'Medium',
    status: 'NotificationsDispatched',
    requestDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    patientName: 'Le Van C',
    patientCondition: 'Anemia Treatment',
    hospitalName: 'Gia Dinh Hospital',
    fulfilledQuantity: 250,
  },
  {
    id: 'SOS-2023-0804',
    bloodType: 'AB+',
    quantity: 2000,
    urgency: 'Critical',
    status: 'Fulfilled',
    requestDate: new Date(Date.now() - 3600000 * 48).toISOString(),
    patientName: 'Pham Thi D',
    patientCondition: 'Organ Transplant',
    hospitalName: 'University Medical Center',
    fulfilledQuantity: 2000,
  },
];
