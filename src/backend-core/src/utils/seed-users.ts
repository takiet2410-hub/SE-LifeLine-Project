import bcrypt from 'bcrypt';
import { User } from '../modules/auth-account/models/user.model';
import { DonorProfile } from '../modules/auth-account/models/donor-profile.model';
import { Campaign } from '../modules/campaign/models/campaign.model';

export const seedDefaultUsers = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('StrongPass123!', salt);

    const defaultUsers = [
      {
        idDocumentNumber: '079099000111',
        email: 'staff.bloodcenter@lifeline.gov.vn',
        phone: '0909123111',
        passwordHash,
        role: 'BloodCenterStaff' as const,
        roles: ['BloodCenterStaff' as const, 'Donor' as const],
        accountStatus: 'Active' as const,
      },
      {
        idDocumentNumber: '079099000123',
        email: 'staff@lifeline.gov.vn',
        phone: '0909123456',
        passwordHash,
        role: 'BloodCenterStaff' as const,
        roles: ['BloodCenterStaff' as const, 'Donor' as const],
        accountStatus: 'Active' as const,
      },
      {
        idDocumentNumber: '079088000456',
        email: 'doctor@lifeline.gov.vn',
        phone: '0908123456',
        passwordHash,
        role: 'BloodCenterStaff' as const,
        roles: ['BloodCenterStaff' as const, 'Donor' as const],
        accountStatus: 'Active' as const,
      },
      {
        idDocumentNumber: '079077000789',
        email: 'admin@lifeline.gov.vn',
        phone: '0907123456',
        passwordHash,
        role: 'Administrator' as const,
        roles: ['Administrator' as const, 'Donor' as const],
        accountStatus: 'Active' as const,
      },
      {
        idDocumentNumber: '079099000999',
        email: 'donor@lifeline.gov.vn',
        phone: '0901234567',
        passwordHash,
        role: 'Donor' as const,
        roles: ['Donor' as const],
        accountStatus: 'Active' as const,
      },
    ];

    for (const u of defaultUsers) {
      const newUser = await User.findOneAndUpdate(
        { idDocumentNumber: u.idDocumentNumber },
        { $set: u },
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded/Updated user ${u.idDocumentNumber} (${u.role})`);

      if (u.role === 'Donor') {
        const profileExisting = await DonorProfile.findOne({ userId: newUser._id });
        if (!profileExisting) {
          await DonorProfile.create({
            userId: newUser._id,
            fullName: 'Nguyễn Văn Hiến Máu',
            dateOfBirth: new Date('1995-05-15'),
            idDocumentNumber: u.idDocumentNumber,
            phoneNumber: u.phone,
            permanentAddress: '123 Nguyễn Trãi, Phường 2, Quận 5, TP. Hồ Chí Minh',
            bloodType: 'O+',
            gender: 'Male',
            email: u.email,
            totalDonations: 3,
            xp: 150,
            donorLevel: 2,
            emergencyOptIn: true,
          });
          console.log(`✅ Seeded donor profile for ${u.idDocumentNumber}`);
        }
      }
    }

    // Seed default active campaigns if collection is empty
    const campaignCount = await Campaign.countDocuments();
    if (campaignCount === 0) {
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 2);

      const timeSlots = [
        { startTime: '07:30', endTime: '09:00', capacity: 20, registeredCount: 5 },
        { startTime: '09:00', endTime: '10:30', capacity: 20, registeredCount: 8 },
        { startTime: '10:30', endTime: '12:00', capacity: 20, registeredCount: 4 },
        { startTime: '13:30', endTime: '15:00', capacity: 20, registeredCount: 6 },
        { startTime: '15:00', endTime: '16:30', capacity: 20, registeredCount: 2 },
      ];

      await Campaign.insertMany([
        {
          campaignCode: 'CMP-CR-2026',
          name: 'Bệnh viện Chợ Rẫy - Đợt Hiến Máu Nhân Đạo Q5',
          description: 'Chiến dịch hiến máu nhân đạo hỗ trợ cấp cứu và điều trị tại Bệnh viện Chợ Rẫy.',
          venue: 'Bệnh viện Chợ Rẫy',
          fullAddress: '201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP. Hồ Chí Minh',
          location: { type: 'Point', coordinates: [106.660172, 10.755498] },
          startDateTime: now,
          endDateTime: nextMonth,
          capacity: 100,
          registeredCount: 25,
          targetUnitsGoal: 80,
          contactPerson: { name: 'Đội Tình Nguyện Chợ Rẫy', phone: '02838554137' },
          status: 'Active',
          targetBloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
          timeSlots,
        },
        {
          campaignCode: 'CMP-TMHH-2026',
          name: 'Bệnh viện Truyền Máu Huyết Học - Đợt Tiếp Nhận Máu',
          description: 'Đợt tiếp nhận máu lưu động chuẩn quốc tế tại Bệnh viện Truyền máu Huyết học.',
          venue: 'Bệnh viện Truyền máu Huyết học',
          fullAddress: '118 Hồng Bàng, Phường 12, Quận 5, TP. Hồ Chí Minh',
          location: { type: 'Point', coordinates: [106.666133, 10.756247] },
          startDateTime: now,
          endDateTime: nextMonth,
          capacity: 150,
          registeredCount: 40,
          targetUnitsGoal: 120,
          contactPerson: { name: 'Khoa Tiếp Nhận Máu', phone: '02839571342' },
          status: 'Active',
          targetBloodGroups: ['A+', 'B+', 'O+', 'O-'],
          timeSlots,
        },
        {
          campaignCode: 'CMP-TD-2026',
          name: 'Bệnh viện Từ Dũ - Ngày Hội Hiến Máu Mẹ & Bé',
          description: 'Chương trình hiến máu tình nguyện dành cho sản phụ và nhi khoa.',
          venue: 'Bệnh viện Từ Dũ',
          fullAddress: '284 Cống Quỳnh, Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh',
          location: { type: 'Point', coordinates: [106.683610, 10.763428] },
          startDateTime: now,
          endDateTime: nextMonth,
          capacity: 90,
          registeredCount: 15,
          targetUnitsGoal: 70,
          contactPerson: { name: 'Đoàn Thanh Niên Từ Dũ', phone: '02854042829' },
          status: 'Active',
          targetBloodGroups: ['O-', 'AB-', 'A+', 'B+'],
          timeSlots,
        },
      ]);
      console.log('✅ Seeded default active campaigns in MongoDB');
    }
  } catch (err) {
    console.error('❌ Error seeding default data:', err);
  }
};
