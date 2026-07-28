export interface CampaignData {
  _id: string;
  bloodCenterId: string;
  name: string;
  venue: string;
  location: { type: string; coordinates: [number, number] };
  startDateTime: string;
  endDateTime: string;
  targetBloodGroups: string[];
  capacity: number;
  registeredCount: number;
  status: 'Draft' | 'Active' | 'Full' | 'Closed' | 'Cancelled';
  createdAt: string;
}

export interface RegistrationData {
  _id: string;
  campaignId: string;
  donorId: string;
  donorName: string;
  donorBloodType: string;
  donorDob: string;
  donorIdCard: string;
  donorPhone: string;
  appointmentDate: string;
  status: 'Pending' | 'Confirmed' | 'Registered' | 'CheckedIn' | 'Eligible' | 'Completed' | 'Ineligible' | 'Cancelled' | 'NoShow' | 'cancelled' | 'no-show';
  bloodPressure?: string;
  weight?: number;
  bodyTemperature?: number;
  hemoglobinLevel?: number;
  screeningNotes?: string;
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
  type: 'Routine' | 'SOS' | 'Campaign' | 'System';
  title: string;
  body: string;
  senderName: string;
  createdAt: string;
  readAt: string | null;
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
  donorSourceId?: string;
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
    _id: 'cam-001',
    bloodCenterId: 'bc-01',
    name: 'Chiến dịch Hiến máu Tình nguyện Mùa Hè 2026',
    venue: 'Ủy ban Nhân dân Quận 1, 47 Lê Duẩn, TP.HCM',
    location: { type: 'Point', coordinates: [106.698, 10.778] },
    startDateTime: '2026-07-20T08:00:00Z',
    endDateTime: '2026-07-25T17:00:00Z',
    targetBloodGroups: ['O+', 'O-', 'A+', 'B+'],
    capacity: 100,
    registeredCount: 45,
    status: 'Active',
    createdAt: '2026-07-01T10:00:00Z',
  },
  {
    _id: 'cam-002',
    bloodCenterId: 'bc-01',
    name: 'Giọt Hồng Công Nghệ — Sài Gòn Tech Park',
    venue: 'Sảnh A, Khu Công Nghệ Cao Quận 9, TP. Thủ Đức',
    location: { type: 'Point', coordinates: [106.79, 10.84] },
    startDateTime: '2026-08-01T08:00:00Z',
    endDateTime: '2026-08-03T16:30:00Z',
    targetBloodGroups: ['A-', 'B-', 'AB-', 'O-'],
    capacity: 150,
    registeredCount: 150,
    status: 'Full',
    createdAt: '2026-07-10T09:00:00Z',
  },
  {
    _id: 'cam-003',
    bloodCenterId: 'bc-01',
    name: 'Ngày Hội Hiến Máu Sinh Viên Đại Học Y Dược',
    venue: 'Khuôn viên ĐH Y Dược, 217 Hồng Bàng, Quận 5',
    location: { type: 'Point', coordinates: [106.66, 10.75] },
    startDateTime: '2026-08-15T07:30:00Z',
    endDateTime: '2026-08-16T17:00:00Z',
    targetBloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    capacity: 200,
    registeredCount: 12,
    status: 'Draft',
    createdAt: '2026-07-15T14:00:00Z',
  },
];

export const initialRegistrations: RegistrationData[] = [];

export const initialArticles: ArticleData[] = [
  {
    _id: 'art-001',
    authorStaffId: 'staff-01',
    authorName: 'BS. Nguyễn Văn A',
    title: 'Những Lưu Ý Quan Trọng Trước Và Sau Khi Hiến Máu Tình Nguyện',
    category: 'Sức Khỏe',
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
    category: 'Chiến Dịch',
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
    title: 'Chiến dịch "Hiến máu Mùa Hè 2026" đạt 45% chỉ tiêu',
    body: 'Đã có 45 người đăng ký thành công cho điểm hiến máu Quận 1.',
    senderName: 'Hệ thống LifeLine',
    createdAt: '2026-07-21T12:00:00Z',
    readAt: '2026-07-21T14:00:00Z',
  },
  {
    _id: 'notif-003',
    type: 'Routine',
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
