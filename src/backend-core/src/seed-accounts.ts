import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import dns from 'dns';

import { User } from './modules/auth-account/models/user.model';
import { DonorProfile } from './modules/auth-account/models/donor-profile.model';
import { Hospital } from './modules/auth-account/models/hospital.model';
import { BloodCenter } from './modules/auth-account/models/blood-center.model';

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config();

const URIS_TO_TRY = [
  process.env.MONGODB_URI,
  'mongodb://nguyenquocduong2006_db_user:9TXhj49vOIUhnMHS@lifeline-shard-00-00.exrbuok.mongodb.net:27017,lifeline-shard-00-01.exrbuok.mongodb.net:27017,lifeline-shard-00-02.exrbuok.mongodb.net:27017/LifeLine?ssl=true&authSource=admin&retryWrites=true',
].filter(Boolean) as string[];

async function seedTestAccounts() {
  let connected = false;
  for (const uri of URIS_TO_TRY) {
    try {
      console.log('Attempting MongoDB connection at:', uri);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      connected = true;
      console.log('Connected successfully to:', uri);
      break;
    } catch (e: any) {
      console.warn('Failed connection to:', uri, e.message);
    }
  }

  if (!connected) {
    console.error('Could not connect to any MongoDB endpoint.');
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 1. Seed Blood Centers with GPS Coordinates
    console.log('\n--- 🏥 Seeding Blood Centers ---');
    let bloodCenter = await BloodCenter.findOne({ name: /Huyết học/i });
    if (!bloodCenter) {
      bloodCenter = await BloodCenter.create({
        name: 'Trung tâm Truyền máu Huyết học TP.HCM',
        address: '118 Hồng Bàng, Phường 12, Quận 5, TP.HCM',
        location: {
          type: 'Point',
          coordinates: [106.6622, 10.7594], // [lng, lat]
        },
        contactPhone: '02839571342',
        operatingHours: '07:00 - 17:00 (Thứ 2 - Chủ Nhật)',
      });
      console.log(`✅ Created Blood Center: ${bloodCenter.name}`);
    } else {
      console.log(`ℹ️ Blood Center existing: ${bloodCenter.name}`);
    }

    // 2. Seed Hospitals with GPS Coordinates
    console.log('\n--- 🏥 Seeding Hospitals ---');
    const hospitalEntities = [
      {
        name: 'Bệnh viện Chợ Rẫy (Khoa Cấp Cứu)',
        address: '201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM',
        coordinates: [106.6597, 10.7554],
        contactPhone: '02838554137',
      },
      {
        name: 'Bệnh viện Nhân Dân 115',
        address: '527 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM',
        coordinates: [106.6667, 10.7733],
        contactPhone: '02838654139',
      },
    ];

    for (const h of hospitalEntities) {
      let hos = await Hospital.findOne({ name: h.name });
      if (!hos) {
        hos = await Hospital.create({
          name: h.name,
          address: h.address,
          location: {
            type: 'Point',
            coordinates: h.coordinates,
          },
          contactPhone: h.contactPhone,
          isVerified: true,
        });
        console.log(`✅ Created Hospital: ${hos.name}`);
      } else {
        console.log(`ℹ️ Hospital existing: ${hos.name}`);
      }
    }

    // 3. Seed Accounts (Users & Profiles) with Real GPS
    console.log('\n--- 👤 Seeding Test Accounts ---');
    const testUsers = [
      // Donors
      {
        email: 'donor@lifeline.vn',
        idDocumentNumber: '079099000998',
        fullName: 'Nguyễn Văn Donor (Quận 1)',
        phone: '0901234567',
        role: 'Donor' as const,
        roles: ['Donor'],
        bloodType: 'O+',
        coordinates: [106.6983, 10.7719], // Chợ Bến Thành, Quận 1
        address: 'Phường Bến Thành, Quận 1, TP.HCM',
      },
      {
        email: 'donor.o_minus@lifeline.vn',
        idDocumentNumber: '079099000888',
        fullName: 'Trần Thị Donor (Máu O- Khẩn Cấp)',
        phone: '0901234568',
        role: 'Donor' as const,
        roles: ['Donor'],
        bloodType: 'O-',
        coordinates: [106.6597, 10.7554], // Gần BV Chợ Rẫy, Quận 5
        address: 'Phường 12, Quận 5, TP.HCM',
      },
      {
        email: 'donor.ab@lifeline.vn',
        idDocumentNumber: '079099000777',
        fullName: 'Lê Hoàng Donor (Quận 10)',
        phone: '0901234569',
        role: 'Donor' as const,
        roles: ['Donor'],
        bloodType: 'AB+',
        coordinates: [106.6667, 10.7733], // Gần BV 115, Quận 10
        address: 'Phường 12, Quận 10, TP.HCM',
      },
      // Hospital Staff
      {
        email: 'hospital@lifeline.vn',
        idDocumentNumber: '079088000457',
        fullName: 'Bác Sĩ Cấp Cứu (BV Chợ Rẫy)',
        phone: '0908123457',
        role: 'HospitalStaff' as const,
        roles: ['HospitalStaff'],
      },
      {
        email: 'hospital.115@lifeline.vn',
        idDocumentNumber: '079088000458',
        fullName: 'Bác Sĩ Trực Cấp Cứu (BV 115)',
        phone: '0908123458',
        role: 'HospitalStaff' as const,
        roles: ['HospitalStaff'],
      },
      // Blood Center Staff
      {
        email: 'bloodcenter@lifeline.vn',
        idDocumentNumber: '079099000112',
        fullName: 'Bác Sĩ Ngân Hàng Máu',
        phone: '0909123112',
        role: 'BloodCenterStaff' as const,
        roles: ['BloodCenterStaff'],
        bloodCenterId: bloodCenter._id,
      },
      // Administrator
      {
        email: 'admin@lifeline.gov.vn',
        idDocumentNumber: '079077000790',
        fullName: 'Quản Trị Viên Hệ Thống',
        phone: '0907123457',
        role: 'Administrator' as const,
        roles: ['Administrator'],
      },
    ];

    for (const data of testUsers) {
      let user = await User.findOne({
        $or: [{ email: data.email }, { idDocumentNumber: data.idDocumentNumber }],
      });

      if (!user) {
        user = await User.create({
          idDocumentNumber: data.idDocumentNumber,
          email: data.email,
          phone: data.phone,
          passwordHash,
          role: data.role as any,
          roles: data.roles as any,
          bloodCenterId: (data as any).bloodCenterId,
          accountStatus: 'Active',
        });
        console.log(`✅ Created User: ${data.email} (${data.role})`);
      } else {
        user.idDocumentNumber = data.idDocumentNumber;
        user.passwordHash = passwordHash;
        user.accountStatus = 'Active';
        user.role = data.role as any;
        user.roles = data.roles as any;
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        if ((data as any).bloodCenterId) user.bloodCenterId = (data as any).bloodCenterId;
        await user.save();
        console.log(`🔄 Updated User Password & Role: ${data.email}`);
      }

      // Upsert DonorProfile with GPS coordinates
      if (data.role === 'Donor' && data.coordinates) {
        await DonorProfile.updateOne(
          { userId: user._id },
          {
            $set: {
              fullName: data.fullName,
              bloodType: data.bloodType || 'O+',
              phoneNumber: data.phone,
              permanentAddress: data.address || 'TP. Hồ Chí Minh',
              dateOfBirth: new Date('1998-05-15'),
              idDocumentNumber: data.idDocumentNumber,
              location: {
                type: 'Point',
                coordinates: data.coordinates, // [lng, lat]
              },
              emergencyOptIn: true,
            },
          },
          { upsert: true }
        );
        console.log(`   📍 Donor Profile & GPS coordinates updated for: ${data.fullName}`);
      }
    }

    console.log('\n🎉 ALL REAL ACCOUNTS WITH GPS LOCATION CREATED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error seeding test accounts:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seedTestAccounts();
