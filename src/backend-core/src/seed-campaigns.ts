import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Campaign } from './modules/campaign/models/campaign.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://nguyenquocduong2006_db_user:9TXhj49vOIUhnMHS@lifeline.exrbuok.mongodb.net/LifeLine?appName=LifeLine';

const seedCampaigns = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear old test campaigns
    await Campaign.deleteMany({});
    console.log('Cleared old campaigns.');

    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 2);

    const timeSlots = [
      { startTime: '07:30', endTime: '09:00', capacity: 20, registeredCount: 5 },
      { startTime: '09:00', endTime: '10:30', capacity: 20, registeredCount: 8 },
      { startTime: '10:30', endTime: '12:00', capacity: 20, registeredCount: 4 },
      { startTime: '13:30', endTime: '15:00', capacity: 20, registeredCount: 6 },
      { startTime: '15:00', endTime: '16:30', capacity: 20, registeredCount: 2 }
    ];

    const hcmcCampaigns = [
      {
        campaignCode: 'CMP-CR-2026',
        name: 'Bệnh viện Chợ Rẫy - Đợt Hiến Máu Nhân Đạo Q5',
        description: 'Chiến dịch hiến máu nhân đạo hỗ trợ cấp cứu và điều trị tại Bệnh viện Chợ Rẫy.',
        venue: 'Bệnh viện Chợ Rẫy',
        fullAddress: '201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP. Hồ Chí Minh',
        location: {
          type: 'Point',
          coordinates: [106.660172, 10.755498] // Lng, Lat
        },
        startDateTime: now,
        endDateTime: nextMonth,
        capacity: 100,
        registeredCount: 25,
        targetUnitsGoal: 80,
        contactPerson: { name: 'Đội Tình Nguyện Chợ Rẫy', phone: '02838554137' },
        status: 'Active',
        targetBloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        timeSlots
      },
      {
        campaignCode: 'CMP-TMHH-2026',
        name: 'Bệnh viện Truyền Máu Huyết Học - Đợt Tiếp Nhận Máu',
        description: 'Đợt tiếp nhận máu lưu động chuẩn quốc tế tại Bệnh viện Truyền máu Huyết học.',
        venue: 'Bệnh viện Truyền máu Huyết học',
        fullAddress: '118 Hồng Bàng, Phường 12, Quận 5, TP. Hồ Chí Minh',
        location: {
          type: 'Point',
          coordinates: [106.666133, 10.756247]
        },
        startDateTime: now,
        endDateTime: nextMonth,
        capacity: 150,
        registeredCount: 40,
        targetUnitsGoal: 120,
        contactPerson: { name: 'Khoa Tiếp Nhận Máu', phone: '02839571342' },
        status: 'Active',
        targetBloodGroups: ['A+', 'B+', 'O+', 'O-'],
        timeSlots
      },
      {
        campaignCode: 'CMP-TD-2026',
        name: 'Bệnh viện Từ Dũ - Ngày Hội Hiến Máu Mẹ & Bé',
        description: 'Chương trình hiến máu tình nguyện dành cho sản phụ và nhi khoa.',
        venue: 'Bệnh viện Từ Dũ',
        fullAddress: '284 Cống Quỳnh, Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh',
        location: {
          type: 'Point',
          coordinates: [106.683610, 10.763428]
        },
        startDateTime: now,
        endDateTime: nextMonth,
        capacity: 90,
        registeredCount: 15,
        targetUnitsGoal: 70,
        contactPerson: { name: 'Đoàn Thanh Niên Từ Dũ', phone: '02854042829' },
        status: 'Active',
        targetBloodGroups: ['O-', 'AB-', 'A+', 'B+'],
        timeSlots
      },
      {
        campaignCode: 'CMP-115-2026',
        name: 'Bệnh viện Nhân Dân 115 - Giọt Máu Hồng Cấp Cứu',
        description: 'Chiến dịch bổ sung dự trữ máu cấp cứu đột quỵ và tim mạch tại Bệnh viện 115.',
        venue: 'Bệnh viện Nhân dân 115',
        fullAddress: '520 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
        location: {
          type: 'Point',
          coordinates: [106.660812, 10.771945]
        },
        startDateTime: now,
        endDateTime: nextMonth,
        capacity: 120,
        registeredCount: 30,
        targetUnitsGoal: 100,
        contactPerson: { name: 'BS. Trần Văn Nam', phone: '02838652368' },
        status: 'Active',
        targetBloodGroups: ['O+', 'A+', 'B+'],
        timeSlots
      },
      {
        campaignCode: 'CMP-GD-2026',
        name: 'Bệnh viện Nhân Dân Gia Định - Ngày Hiến Máu Bình Thạnh',
        description: 'Điểm hiến máu nhân đạo phục vụ khu vực Bình Thạnh và Phú Nhuận.',
        venue: 'Bệnh viện Nhân dân Gia Định',
        fullAddress: '1 Nơ Trang Long, Phường 7, Bình Thạnh, TP. Hồ Chí Minh',
        location: {
          type: 'Point',
          coordinates: [106.696120, 10.803510]
        },
        startDateTime: now,
        endDateTime: nextMonth,
        capacity: 100,
        registeredCount: 18,
        targetUnitsGoal: 85,
        contactPerson: { name: 'Phòng Công Tác Xã Hội', phone: '02838412697' },
        status: 'Active',
        targetBloodGroups: ['O-', 'AB-', 'A+'],
        timeSlots
      },
      {
        campaignCode: 'CMP-175-2026',
        name: 'Bệnh viện Quân Y 175 - Giọt Máu Chiến Sĩ Gò Vấp',
        description: 'Ngày hội hiến máu quân dân y tại Bệnh viện Quân Y 175.',
        venue: 'Bệnh viện Quân Y 175',
        fullAddress: '786 Nguyễn Kiệm, Phường 3, Gò Vấp, TP. Hồ Chí Minh',
        location: {
          type: 'Point',
          coordinates: [106.678240, 10.817530]
        },
        startDateTime: now,
        endDateTime: nextMonth,
        capacity: 130,
        registeredCount: 22,
        targetUnitsGoal: 100,
        contactPerson: { name: 'Ban Thanh Niên BV 175', phone: '02838942438' },
        status: 'Active',
        targetBloodGroups: ['O+', 'B+', 'A+'],
        timeSlots
      },
      {
        campaignCode: 'CMP-TD-CITY-2026',
        name: 'Bệnh viện TP. Thủ Đức - Kết Nối Yêu Thương',
        description: 'Điểm tiếp nhận máu tình nguyện TP. Thủ Đức.',
        venue: 'Bệnh viện Thành phố Thủ Đức',
        fullAddress: '29 Phú Châu, Tam Phú, Thủ Đức, TP. Hồ Chí Minh',
        location: {
          type: 'Point',
          coordinates: [106.758410, 10.852530]
        },
        startDateTime: now,
        endDateTime: nextMonth,
        capacity: 110,
        registeredCount: 14,
        targetUnitsGoal: 90,
        contactPerson: { name: 'Đoàn Thanh Niên Thủ Đức', phone: '02837206000' },
        status: 'Active',
        targetBloodGroups: ['A+', 'O+', 'B+'],
        timeSlots
      }
    ];

    await Campaign.insertMany(hcmcCampaigns);
    console.log('Successfully seeded 7 realistic HCMC active campaigns!');

    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding campaigns:', error);
    process.exit(1);
  }
};

seedCampaigns();
