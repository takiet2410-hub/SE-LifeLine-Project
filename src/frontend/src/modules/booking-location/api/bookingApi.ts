import { apiClient } from '../../../shared/api/apiClient';

// Backend AppointmentStatus enum values
export type BackendAppointmentStatus = 'Scheduled' | 'CheckedIn' | 'Registered' | 'Eligible' | 'Examining' | 'Completed' | 'Cancelled' | 'NoShow' | 'Pending' | 'Confirmed' | 'Rejected' | 'Ineligible';

// Backend Campaign (when populated in appointment)
export interface BackendCampaign {
  _id: string;
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  registeredCount: number;
  status: string;
  targetBloodGroups: string[];
  timeslots: Array<{
    startTime: string;
    endTime: string;
    capacity: number;
    registeredCount: number;
  }>;
}

// Backend ETicket (when populated)
export interface BackendETicket {
  _id: string;
  appointmentId: string;
  ticketCode: string;
  qrPayloadSigned: string;
  fileUrl?: string;
  issuedAt: string;
}

// Raw backend appointment shape (as returned by API before mapping)
export interface BackendAppointment {
  _id: string;
  donorId: string;
  campaignId: BackendCampaign | string;
  appointmentDate: string;
  timeSlot: string;
  status: BackendAppointmentStatus;
  screeningFormId?: string | { responses: Array<{ response: any }> };
  eTicketId?: BackendETicket | string;
  createdAt: string;
  updatedAt: string;
}

// Mapped frontend appointment shape (used by UI components)
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled' | 'no-show' | 'pending' | 'rejected';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  location: {
    id: string;
    name: string;
    address: string;
  };
  bloodType?: string;
  status: AppointmentStatus;
  healthSummary?: {
    bloodPressure?: string;
    heartRate?: string;
    weight?: string;
    hemoglobin?: string;
  };
  qrCodeUrl?: string;
  rejectionReason?: string;
  screeningNotes?: string;
  // Raw backend fields (accessible when needed)
  _raw?: BackendAppointment;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Map backend status to frontend status
const mapStatus = (backendStatus: BackendAppointmentStatus): AppointmentStatus => {
  switch (backendStatus) {
    case 'Pending':
      return 'pending';
    case 'Confirmed':
    case 'Scheduled':
    case 'CheckedIn':
    case 'Examining':
      return 'upcoming';
    case 'Completed':
      return 'completed';
    case 'Cancelled':
      return 'cancelled';
    case 'Rejected':
      return 'rejected';
    case 'NoShow':
      return 'no-show';
    default:
      return 'pending';
  }
};

export const parseDate = (dateInput: string | Date | undefined | null): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

export const formatDateToDDMMYYYY = (dateInput: string | Date | undefined | null): string => {
  const d = parseDate(dateInput);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Map backend appointment to frontend appointment
export const mapBackendAppointment = (raw: BackendAppointment): Appointment => {
  const campaign = typeof raw.campaignId === 'object' ? raw.campaignId : null;
  const eTicket = typeof raw.eTicketId === 'object' ? raw.eTicketId : null;
  const screeningForm = typeof (raw as any).screeningFormId === 'object' ? (raw as any).screeningFormId : null;
  const rawAny = raw as any;

  const isConfirmed = raw.status === 'Confirmed' || raw.status === 'Scheduled' || raw.status === 'CheckedIn' || Boolean(raw.eTicketId);

  // E-Ticket QR Code URL logic:
  // 1. Populated eTicket object fileUrl
  // 2. Direct qrCodeUrl from raw object
  // 3. Standard fallback generator if confirmed
  const qrCodeUrl = eTicket?.fileUrl || rawAny.qrCodeUrl || (isConfirmed ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LifeLineTicket-${raw._id}` : undefined);

  const notes = rawAny.screeningNotes || screeningForm?.screeningNotes || rawAny.rejectionReason || rawAny.reason;

  return {
    id: raw._id,
    date: formatDateToDDMMYYYY(raw.appointmentDate),
    time: raw.timeSlot,
    location: {
      id: campaign?._id || 'unknown',
      name: campaign?.name || 'Chiến dịch Hiến máu LifeLine',
      address: rawAny.address || (campaign as any)?.fullAddress || (campaign as any)?.venue || 'TP. Hồ Chí Minh',
    },
    status: mapStatus(raw.status),
    qrCodeUrl,
    rejectionReason: notes,
    screeningNotes: notes,
    _raw: raw,
  };
};

export const formatSlotTime = (timeVal: any, defaultVal: string = '07:30'): string => {
  if (!timeVal) return defaultVal;
  if (typeof timeVal === 'string' && !timeVal.includes('T')) {
    return timeVal;
  }
  try {
    const d = new Date(timeVal);
    if (isNaN(d.getTime())) return defaultVal;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return defaultVal;
  }
};

// Map backend location/campaign to frontend location for step-1
export const mapBackendCampaignToLocation = (campaign: BackendCampaign) => {
  const cAny = campaign as any;
  const rawSlots = cAny.dailyTimeslots && cAny.dailyTimeslots.length > 0
    ? cAny.dailyTimeslots
    : (cAny.timeslots && cAny.timeslots.length > 0 ? cAny.timeslots : []);

  const timeslots = rawSlots.map((s: any) => ({
    dateStr: s.dateStr,
    startTime: formatSlotTime(s.startTime, '07:30'),
    endTime: formatSlotTime(s.endTime, '11:30'),
    capacity: Number(s.capacity) || 50,
    registeredCount: Number(s.registeredCount) || 0,
  }));

  const formattedDailyTimeslots = cAny.dailyTimeslots && Array.isArray(cAny.dailyTimeslots)
    ? cAny.dailyTimeslots.map((s: any) => ({
        dateStr: s.dateStr,
        startTime: formatSlotTime(s.startTime, '07:30'),
        endTime: formatSlotTime(s.endTime, '11:30'),
        capacity: Number(s.capacity) || 50,
        registeredCount: Number(s.registeredCount) || 0,
      }))
    : [];

  return {
    id: campaign._id || cAny.id,
    name: campaign.name,
    venue: cAny.venue || campaign.name,
    address: cAny.fullAddress || cAny.venue || (campaign.location?.coordinates
      ? `Tọa độ: ${campaign.location.coordinates[1]}, ${campaign.location.coordinates[0]}`
      : 'TP. Hồ Chí Minh'),
    description: cAny.description || '',
    startDateTime: cAny.startDateTime || cAny.startDate,
    endDateTime: cAny.endDateTime || cAny.endDate,
    startDate: cAny.startDate || cAny.startDateTime,
    endDate: cAny.endDate || cAny.endDateTime,
    contactPerson: cAny.contactPerson,
    capacity: cAny.capacity,
    registeredCount: cAny.registeredCount,
    targetUnitsGoal: cAny.targetUnitsGoal,
    dailyTimeslots: formattedDailyTimeslots,
    timeslots,
    status: campaign.status,
    targetBloodGroups: campaign.targetBloodGroups,
    _raw: campaign,
  };
};

export const fetchAppointments = async (): Promise<ApiResponse<Appointment[]>> => {
  try {
    const response = await apiClient.get('/bookings/appointments');
    // Backend returns array directly: res.status(200).json(appointments)
    const rawAppointments: BackendAppointment[] = response.data;
    const mapped = rawAppointments.map(mapBackendAppointment);
    return {
      success: true,
      data: mapped,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể tải danh sách lịch hẹn.',
    };
  }
};

export const fetchAppointmentById = async (id: string): Promise<ApiResponse<Appointment>> => {
  try {
    const response = await apiClient.get(`/bookings/appointments/${id}`);
    const mapped = mapBackendAppointment(response.data);
    return {
      success: true,
      data: mapped,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể tải thông tin lịch hẹn.',
    };
  }
};

export const createAppointment = async (payload: {
  campaignId: string;
  appointmentDate: string;
  timeSlot: string;
  answers: any;
}): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.post('/bookings/appointments', payload);
    // Backend returns the created appointment directly
    const rawAppointment: BackendAppointment = response.data;
    const mapped = mapBackendAppointment(rawAppointment);
    return {
      success: true,
      data: mapped,
      message: 'Tạo lịch hẹn hiến máu thành công!',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Lỗi đặt lịch hẹn.',
      data: error.response?.data,
    };
  }
};

export const searchLocations = async (filters?: {
  lat?: number;
  lng?: number;
  radius?: number;
  date?: string;
  bloodType?: string | string[];
  crowdingLevel?: 'Low' | 'Medium' | 'High';
}): Promise<ApiResponse<any[]>> => {
  try {
    const params = new URLSearchParams();
    if (filters?.lat !== undefined) params.append('lat', String(filters.lat));
    if (filters?.lng !== undefined) params.append('lng', String(filters.lng));
    if (filters?.radius !== undefined) params.append('radius', String(filters.radius));
    if (filters?.date) params.append('date', filters.date);
    if (filters?.bloodType) {
      const btVal = Array.isArray(filters.bloodType) ? filters.bloodType.join(',') : filters.bloodType;
      if (btVal) params.append('bloodType', btVal);
    }
    if (filters?.crowdingLevel) params.append('crowdingLevel', filters.crowdingLevel);

    const response = await apiClient.get(`/bookings/locations?${params.toString()}`);
    const campaigns: BackendCampaign[] = response.data;
    return {
      success: true,
      data: campaigns.map(mapBackendCampaignToLocation),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to search locations.',
    };
  }
};

export const cancelAppointment = async (id: string, reason?: string): Promise<ApiResponse> => {
  try {
    const cancelReason = reason || 'Người dùng yêu cầu hủy lịch hẹn';
    const response = await apiClient.patch(`/bookings/appointments/${id}/cancel`, { reason: cancelReason });
    const successMessage = 'Hủy lịch hẹn thành công.';
    const rawAppointment: BackendAppointment = response.data;
    const mapped = mapBackendAppointment(rawAppointment);
    return {
      success: true,
      data: mapped,
      message: successMessage,
    };
  } catch (error: any) {
    const errData = error.response?.data;
    const isDeadline =
      errData?.code === 'CANCELLATION_DEADLINE_PASSED' ||
      errData?.message?.includes('CANCELLATION_DEADLINE_PASSED') ||
      errData?.message?.includes('24');

    const message = isDeadline
      ? 'Đã quá thời hạn hủy lịch hẹn. Theo quy định, không thể hủy lịch hẹn khi thời điểm hẹn cách dưới 24 giờ hoặc lịch hẹn đã qua thời gian tiếp nhận.'
      : errData?.message || 'Lỗi hệ thống. Vui lòng thử lại sau.';

    return {
      success: false,
      message,
    };
  }
};

export const downloadETicket = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await apiClient.get(`/bookings/appointments/${id}/e-ticket`);
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'Tải E-Ticket thành công.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể tạo E-Ticket.',
    };
  }
};

export interface HealthAnswers {
  s1?: 'yes' | 'no';
  s2?: 'yes' | 'no';
  s2_note?: string;
  s3?: 'yes' | 'no' | 'other';
  s3_note?: string;
  s4?: string[];
  s4_note?: string;
  s5?: string[];
  s6?: string[];
  s7?: string[];
  s7_note?: string;
  s8?: string[];
  s8_note?: string;
}

const mapHealthAnswersToBackend = (answers: HealthAnswers): { responses: Array<{ questionId: string; selectedOptions: string[] }> } => {
  const responses: Array<{ questionId: string; selectedOptions: string[] }> = [];

  const addResponse = (questionId: string, selectedOptions: string[]) => {
    if (selectedOptions.length > 0) {
      responses.push({ questionId, selectedOptions });
    }
  };

  const getLabel = (key: string): string => {
    const labels: Record<string, string> = {
      s1_yes: 'Có',
      s1_no: 'Không',
      s2_yes: 'Có',
      s2_no: 'Không',
      s3_yes: 'Có',
      s3_no: 'Không',
      s3_other: 'Bệnh khác',
      s4_recovered: 'Khỏi bệnh sau khi mắc một trong các bệnh: sốt rét, giang mai, lao, viêm não - màng não, uốn ván',
      s4_blood: 'Được truyền máu hoặc các chế phẩm máu',
      s4_vaccine: 'Tiêm vắc xin',
      s4_none: 'Không có',
      s5_recovered: 'Khỏi bệnh sau khi mắc một trong các bệnh: thương hàn, nhiễm trùng máu, bị rắn cắn, viêm tắc động mạch, viêm tắc tĩnh mạch, viêm tụy, viêm tủy xương',
      s5_weightloss: 'Sút cân nhanh không rõ nguyên nhân',
      s5_lymph: 'Nổi hạch kéo dài',
      s5_invasive: 'Thực hiện thủ thuật y tế xâm lấn (chữa răng, châm cứu, lăn kim, nội soi,...)',
      s5_tattoo: 'Xăm, xỏ lỗ tai, lỗ mũi hoặc các vị trí khác trên cơ thể',
      s5_drugs: 'Sử dụng ma túy',
      s5_contact: 'Tiếp xúc trực tiếp với máu, dịch tiết của người khác hoặc bị thương bởi kim tiêm',
      s5_livewith: 'Sinh sống chung với người nhiễm viêm gan siêu vi B',
      s5_sex: 'Quan hệ tình dục với người nhiễm viêm gan siêu vi B, C, HIV, giang mai hoặc người có nguy cơ nhiễm',
      s5_samesex: 'Quan hệ tình dục với người cùng giới',
      s5_none: 'Không có',
      s6_recovered: 'Khỏi bệnh sau khi mắc bệnh viêm đường tiết niệu, viêm da nhiễm trùng, viêm phế quản, viêm phổi, sởi, ho gà, quai bị, sốt xuất huyết, kiết lỵ, tả, Rubella',
      s6_epidemic: 'Đi vào vùng có dịch bệnh lưu hành (sốt rét, sốt xuất huyết, Zika,...)',
      s6_none: 'Không có',
      s7_flu: 'Bị cúm, cảm lạnh, ho, nhức đầu, sốt, đau họng',
      s7_other: 'Khác',
      s7_none: 'Không có',
      s8_meds: 'Dùng thuốc kháng sinh, kháng viêm, Aspirin, Corticoid',
      s8_other: 'Khác',
      s8_none: 'Không có',
    };
    return labels[key] || key;
  };

  if (answers.s1) {
    addResponse('1', [getLabel(`s1_${answers.s1}`)]);
  }

  if (answers.s2) {
    const opts: string[] = [getLabel(`s2_${answers.s2}`)];
    if (answers.s2 === 'yes' && answers.s2_note?.trim()) {
      opts.push(`Mô tả: ${answers.s2_note.trim()}`);
    }
    addResponse('2', opts);
  }

  if (answers.s3) {
    const opts: string[] = [getLabel(`s3_${answers.s3}`)];
    if (answers.s3 === 'other' && answers.s3_note?.trim()) {
      opts.push(`Mô tả: ${answers.s3_note.trim()}`);
    }
    addResponse('3', opts);
  }

  if (answers.s4?.length) {
    const opts = answers.s4
      .filter((v) => v !== 'none')
      .map((v) => getLabel(`s4_${v}`));
    if (answers.s4.includes('none')) {
      opts.push(getLabel('s4_none'));
    }
    if (answers.s4_note?.trim()) {
      opts.push(`Ghi chú: ${answers.s4_note.trim()}`);
    }
    addResponse('4', opts);
  }

  if (answers.s5?.length) {
    const opts = answers.s5
      .filter((v) => v !== 'none')
      .map((v) => getLabel(`s5_${v}`));
    if (answers.s5.includes('none')) {
      opts.push(getLabel('s5_none'));
    }
    addResponse('5', opts);
  }

  if (answers.s6?.length) {
    const opts = answers.s6
      .filter((v) => v !== 'none')
      .map((v) => getLabel(`s6_${v}`));
    if (answers.s6.includes('none')) {
      opts.push(getLabel('s6_none'));
    }
    addResponse('6', opts);
  }

  if (answers.s7?.length) {
    const opts = answers.s7
      .filter((v) => v !== 'none')
      .map((v) => getLabel(`s7_${v}`));
    if (answers.s7.includes('none')) {
      opts.push(getLabel('s7_none'));
    }
    if (answers.s7_note?.trim()) {
      opts.push(`Mô tả: ${answers.s7_note.trim()}`);
    }
    addResponse('7', opts);
  }

  if (answers.s8?.length) {
    const opts = answers.s8
      .filter((v) => v !== 'none')
      .map((v) => getLabel(`s8_${v}`));
    if (answers.s8.includes('none')) {
      opts.push(getLabel('s8_none'));
    }
    if (answers.s8_note?.trim()) {
      opts.push(`Mô tả: ${answers.s8_note.trim()}`);
    }
    addResponse('8', opts);
  }

  return { responses };
};

export { mapHealthAnswersToBackend };

export const syncAppointmentToBloodCenter = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(`/bookings/appointments/${id}/sync-bloodcenter`);
    return {
      success: true,
      message: response.data?.message || 'Đồng bộ hồ sơ thành công.'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Đồng bộ thất bại.'
    };
  }
};

export const confirmAppointmentByBloodCenterApi = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post(`/bookings/appointments/${id}/confirm`);
    return {
      success: true,
      data: response.data,
      message: 'BloodCenter đã duyệt và cấp E-Ticket thành công!'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể xác nhận lịch hẹn.'
    };
  }
};
