import mongoose from 'mongoose';
import { Hospital } from '../../auth-account/models/hospital.model';
import { BloodCenter } from '../../auth-account/models/blood-center.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { User } from '../../auth-account/models/user.model';
import bcrypt from 'bcrypt';
export const seedMockLocationData = async () => {
  try {
    const mockHospitalId = new mongoose.Types.ObjectId('60d21b4667d0d8992e610c86');
    await Hospital.updateOne(
      { _id: mockHospitalId },
      { $set: {
          name: 'Bệnh viện Chợ Rẫy (MOCK DATA)',
          address: '201B Nguyễn Chí Thanh, Quận 5, TP.HCM',
          location: { type: 'Point', coordinates: [106.659616, 10.757826] },
          contactPhone: '02838554137',
          isVerified: true
        }
      },
      { upsert: true }
    );
    console.log('[Seed] Upserted mock Hospital');

    const mockCenterId = new mongoose.Types.ObjectId('60d21b4667d0d8992e610c85');
    await BloodCenter.updateOne(
      { _id: mockCenterId },
      { $set: {
          name: 'Trung tâm Hiến máu (MOCK DATA)',
          address: '106 Thiên Phước, Tân Bình, TP.HCM',
          location: { type: 'Point', coordinates: [106.654316, 10.778889] },
          contactPhone: '02838685509',
          operatingHours: '07:00 - 16:30'
        }
      },
      { upsert: true }
    );
    console.log('[Seed] Upserted mock BloodCenter');

    // Seed mock users for quick login
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('StrongPass123!', salt);

    await User.updateOne(
      { idDocumentNumber: '079088000456' },
      { $set: {
          email: 'hospital@lifeline.vn',
          passwordHash,
          roles: ['HospitalStaff'],
          role: 'HospitalStaff',
          accountStatus: 'Active'
        }
      },
      { upsert: true }
    );
    console.log('[Seed] Upserted mock HospitalStaff user');

    await User.updateOne(
      { idDocumentNumber: '079099000111' },
      { $set: {
          email: 'bloodcenter@lifeline.vn',
          passwordHash,
          roles: ['BloodCenterStaff'],
          role: 'BloodCenterStaff',
          accountStatus: 'Active'
        }
      },
      { upsert: true }
    );
    console.log('[Seed] Upserted mock BloodCenterStaff user');

    await User.updateOne(
      { idDocumentNumber: '079099000999' },
      { $set: {
          email: 'donor@lifeline.vn',
          passwordHash,
          roles: ['Donor'],
          role: 'Donor',
          accountStatus: 'Active'
        }
      },
      { upsert: true }
    );
    const donorUser = await User.findOne({ idDocumentNumber: '079099000999' });
    if (donorUser) {
      await DonorProfile.updateOne(
        { userId: donorUser._id },
        { $set: {
            fullName: 'Nguyen Van Donor',
            dateOfBirth: new Date('1990-01-01'),
            idDocumentNumber: '079099000999',
            phoneNumber: '0901234567',
            permanentAddress: '123 Test Street, HCMC',
            bloodType: 'A+',
            location: { type: 'Point', coordinates: [106.65, 10.75] },
            emergencyOptIn: true
          }
        },
        { upsert: true }
      );
    }
    console.log('[Seed] Upserted mock Donor user and profile');

    // Force Mongoose to build 2dsphere indexes immediately
    await Hospital.createIndexes();
    await BloodCenter.createIndexes();
    await DonorProfile.createIndexes();
    console.log('[Seed] Verified 2dsphere geo indexes');

  } catch (error) {
    console.error('[Seed] Mock data error:', error);
  }
};
