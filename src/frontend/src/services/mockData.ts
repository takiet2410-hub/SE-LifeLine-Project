export interface NotificationPreference {
  sosEnabled: boolean;
  appointmentEnabled: boolean;
  campaignEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
}

export interface CampaignData {
  _id: string;
  bloodCenterId: string;
  name: string;
  description?: string;
  venue: string;
  fullAddress?: string;
  location: { type: string; coordinates: [number, number] };
  startDateTime: string;
  endDateTime: string;
  targetBloodGroups: string[];
  capacity: number;
  targetUnitsGoal: number;
  contactPerson: {
    name: string;
    phone: string;
  };
  timeslots: Array<{
    startTime: string;
    endTime: string;
    capacity: number;
    registeredCount: number;
  }>;
  dailyTimeslots?: Array<{
    dateStr: string;
    startTime: string;
    endTime: string;
    capacity: number;
    registeredCount: number;
  }>;
  registeredCount: number;
  status: 'Draft' | 'Upcoming' | 'Registration Pending' | 'Active' | 'Full' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface RegistrationData {
  _id: string;
  campaignId: string;
  campaignName?: string;
  campaignVenue?: string;
  donorId: string;
  donorName: string;
  donorBloodType: string;
  donorDob: string;
  donorIdCard: string;
  donorPhone: string;
  appointmentDate: string;
  timeSlot?: string;
  status: 'Pending' | 'Confirmed' | 'Registered' | 'CheckedIn' | 'Eligible' | 'Examining' | 'Completed' | 'Ineligible' | 'Cancelled' | 'NoShow' | 'cancelled' | 'no-show';
  examiningResult?: 'Passed' | 'Issue' | 'Pending';
  testResult?: 'Pass' | 'Rejected' | string;
  bloodPressure?: string;
  weight?: number;
  bodyTemperature?: number;
  hemoglobinLevel?: number;
  screeningNotes?: string;
  donationVolume?: number;
  donationHistory?: Array<{
    _id?: string;
    appointmentDate: string;
    timeSlot?: string;
    donationType?: string;
    volume?: string;
    locationName?: string;
    status: string;
  }>;
  screeningForm?: {
    screeningFormId?: string;
    outcome?: 'PASS' | 'REJECT' | 'REVIEW';
    responses?: Array<{
      questionId: string;
      selectedOptions: string[];
      description?: string;
    }>;
  };
}

export interface ArticleData {
  _id: string;
  authorStaffId: string;
  authorName: string;
  title: string;
  category: string;
  bodyContent: string;
  imageUrls: string[];
  status: 'Draft' | 'Published' | 'Unpublished';
  publishedAt: string | null;
  createdAt: string;
}

export interface NotificationData {
  _id: string;
  type: 'Routine' | 'SOS' | 'Campaign' | 'System' | 'Appointment';
  channel: 'Email' | 'WebPush' | 'InApp';
  title: string;
  body: string;
  payload: Record<string, any>;
  sourceRefId: string;
  sourceRefType: 'Appointment' | 'Campaign' | 'SOSRequest' | 'Article' | 'System';
  deliveryStatus: 'Pending' | 'Sent' | 'Failed' | 'Retried';
  readAt: string | null;
  createdAt: string;
  // Backward compatibility for existing FE code
  senderName?: string;
  sosRequestInfo?: {
    bloodType: string;
    urgencyLevel: 'Critical' | 'High' | 'Medium';
    requiredQuantityMl: number;
    hospitalName: string;
    fulfillmentDeadline: string;
    patientReference: string;
  };
}

export interface BloodBagData {
  _id: string;
  bagCode: string;
  bloodType: string;
  volumeMl: number;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  status: 'Available' | 'Reserved' | 'Used' | 'Expired' | 'Discarded';
  donorSourceId?: string | any;
  campaignSourceId?: string | any;
  testResult?: 'Pass' | 'Rejected' | 'Pending' | string;
  statusHistory: Array<{
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    changedAt: string;
    reason?: string;
  }>;
}

// Initial Mock Datasets
export const initialCampaigns: CampaignData[] = [
  {
    _id: 'c1',
    bloodCenterId: 'bc-01',
    name: 'Ngày Hội Hiến Máu Tình Nguyện - Mùa Hè Yêu Thương',
    venue: 'Nhà Văn Hóa Thanh Niên',
    location: { type: 'Point', coordinates: [106.696172, 10.782622] },
    startDateTime: '2026-06-15T07:00:00Z',
    endDateTime: '2026-06-15T11:00:00Z',
    targetBloodGroups: ['O+', 'A+', 'B+', 'AB+'],
    capacity: 200,
    targetUnitsGoal: 200,
    contactPerson: { name: 'Admin', phone: '0901234567' },
    timeslots: [
      { startTime: '07:00', endTime: '11:00', capacity: 200, registeredCount: 150 }
    ],
    registeredCount: 150,
    status: 'Active',
    createdAt: '2026-05-01T00:00:00Z',
  },
  {
    _id: 'c2',
    bloodCenterId: 'bc-01',
    name: 'Giọt Máu Hồng Cứu Người',
    venue: 'Đại Học Quốc Gia TP.HCM',
    location: { type: 'Point', coordinates: [106.8031, 10.8700] },
    startDateTime: '2026-06-20T08:00:00Z',
    endDateTime: '2026-06-20T16:00:00Z',
    targetBloodGroups: ['O-', 'A-', 'B-'],
    capacity: 100,
    targetUnitsGoal: 100,
    contactPerson: { name: 'Admin', phone: '0901234567' },
    timeslots: [
      { startTime: '08:00', endTime: '16:00', capacity: 100, registeredCount: 100 }
    ],
    registeredCount: 100,
    status: 'Full',
    createdAt: '2026-05-10T00:00:00Z',
  },
  {
    _id: 'cam-003',
    bloodCenterId: 'bc-01',
    name: 'Hiến Máu Tình Nguyện Mùa Thu',
    venue: 'Công viên Gia Định',
    location: { type: 'Point', coordinates: [106.6781, 10.8123] },
    startDateTime: '2026-08-10T07:30:00Z',
    endDateTime: '2026-08-10T11:30:00Z',
    targetBloodGroups: ['O+', 'A+'],
    capacity: 300,
    targetUnitsGoal: 300,
    contactPerson: { name: 'Admin', phone: '0901234567' },
    timeslots: [
      { startTime: '07:30', endTime: '11:30', capacity: 300, registeredCount: 0 }
    ],
    registeredCount: 0,
    status: 'Draft',
    createdAt: '2026-06-01T00:00:00Z',
  },
];

export const initialRegistrations: RegistrationData[] = [];

export const initialArticles: ArticleData[] = [
  {
    _id: 'art-001',
    authorStaffId: 'staff-01',
    authorName: 'BS. Nguyễn Văn A',
    title: 'Những Lưu Ý Quan Trọng Trước Và Sau Khi Hiến Máu Tình Nguyện',
    category: 'Educational',
    bodyContent: '<p>Hiến máu tình nguyện là một nghĩa cử cao đẹp. Để đảm bảo an toàn cho bản thân và chất lượng túi máu, người hiến máu cần lưu ý uống đủ nước, ăn nhẹ và nghỉ ngơi hợp lý trước khi đến điểm hiến máu...</p>',
    imageUrls: ['https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&q=80'],
    status: 'Published',
    publishedAt: '2026-07-10T08:00:00Z',
    createdAt: '2026-07-09T14:00:00Z',
  },
  {
    _id: 'art-002',
    authorStaffId: 'staff-01',
    authorName: 'BS. Nguyễn Văn A',
    title: 'Chiến Dịch Hè 2026: Lịch Trình Chi Tiết Các Điểm Hiến Máu Lưu Động',
    category: 'Campaign',
    bodyContent: '<p>Trung tâm Huyết học thông báo lịch trình các điểm hiến máu lưu động tại các quận huyện trong tháng 8/2026...</p>',
    imageUrls: ['https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80'],
    status: 'Published',
    publishedAt: '2026-07-18T10:00:00Z',
    createdAt: '2026-07-17T09:00:00Z',
  },
];

export const initialNotifications: NotificationData[] = [
  {
    _id: 'notif-sos-001',
    type: 'SOS',
    channel: 'InApp',
    deliveryStatus: 'Sent',
    sourceRefType: 'System',
    sourceRefId: 'sos-001',
    payload: {},
    title: 'CẤP CỨU: Cần 2000ml máu O- gấp cho ca phẫu thuật',
    body: 'Bệnh viện Chợ Rẫy yêu cầu cung cấp gấp 2000ml máu O- cho bệnh nhân cấp cứu tai nạn giao thông.',
    senderName: 'Bệnh viện Chợ Rẫy',
    createdAt: '2026-07-21T17:30:00Z',
    readAt: null,
    sosRequestInfo: {
      bloodType: 'O-',
      urgencyLevel: 'Critical',
      requiredQuantityMl: 2000,
      hospitalName: 'Bệnh viện Chợ Rẫy',
      fulfillmentDeadline: '2026-07-22T14:00:00Z',
      patientReference: '#PTN-CR-20260721-99',
    },
  },
  {
    _id: 'notif-002',
    type: 'Campaign',
    channel: 'InApp',
    deliveryStatus: 'Sent',
    sourceRefType: 'System',
    sourceRefId: 'camp-001',
    payload: {},
    title: 'Chiến dịch "Hiến máu Mùa Hè 2026" đạt 45% chỉ tiêu',
    body: 'Đã có 45 người đăng ký thành công cho điểm hiến máu Quận 1.',
    senderName: 'Hệ thống LifeLine',
    createdAt: '2026-07-21T12:00:00Z',
    readAt: '2026-07-21T14:00:00Z',
  },
  {
    _id: 'notif-003',
    type: 'Routine',
    channel: 'InApp',
    deliveryStatus: 'Sent',
    sourceRefType: 'System',
    sourceRefId: 'rout-001',
    payload: {},
    title: 'Báo cáo tồn kho máu tuần 3 tháng 7 đã sẵn sàng',
    body: 'Báo cáo tự động tổng hợp số lượng túi máu theo nhóm máu và hạn sử dụng.',
    senderName: 'Hệ thống Quản lý Kho',
    createdAt: '2026-07-20T08:00:00Z',
    readAt: null,
  },
];

export const initialBloodBags: BloodBagData[] = [
  {
    _id: 'bag-001',
    bagCode: 'BB-2026-0451',
    bloodType: 'O+',
    volumeMl: 350,
    collectionDate: '2026-06-25T08:00:00Z',
    expiryDate: '2026-07-23T08:00:00Z', // Expires in 2 days (Near Expiry)
    storageLocation: 'Khu A - Tủ đông 02',
    status: 'Available',
    donorSourceId: 'donor-101',
    statusHistory: [
      {
        previousStatus: 'None',
        newStatus: 'Available',
        changedBy: 'Kỹ thuật viên Lê Văn C',
        changedAt: '2026-06-25T10:00:00Z',
        reason: 'Nhập kho sau kiểm định xét nghiệm',
      },
    ],
  },
  {
    _id: 'bag-002',
    bagCode: 'BB-2026-0389',
    bloodType: 'A-',
    volumeMl: 450,
    collectionDate: '2026-06-26T09:00:00Z',
    expiryDate: '2026-07-24T09:00:00Z', // Expires in 3 days (Critical Near Expiry)
    storageLocation: 'Khu A - Tủ đông 01',
    status: 'Available',
    statusHistory: [],
  },
  {
    _id: 'bag-003',
    bagCode: 'BB-2026-0412',
    bloodType: 'B+',
    volumeMl: 350,
    collectionDate: '2026-06-28T10:00:00Z',
    expiryDate: '2026-07-26T10:00:00Z', // Expires in 5 days
    storageLocation: 'Khu B - Tủ đông 03',
    status: 'Available',
    statusHistory: [],
  },
  {
    _id: 'bag-004',
    bagCode: 'BB-2026-0510',
    bloodType: 'O-',
    volumeMl: 350,
    collectionDate: '2026-07-15T08:30:00Z',
    expiryDate: '2026-08-25T08:30:00Z',
    storageLocation: 'Khu D - Tủ đông Đặc biệt',
    status: 'Available',
    statusHistory: [],
  },
  {
    _id: 'bag-005',
    bagCode: 'BB-2026-0219',
    bloodType: 'AB+',
    volumeMl: 350,
    collectionDate: '2026-05-10T08:00:00Z',
    expiryDate: '2026-06-15T08:00:00Z',
    storageLocation: 'Khu C - Tủ 04',
    status: 'Expired',
    statusHistory: [],
  },
];
