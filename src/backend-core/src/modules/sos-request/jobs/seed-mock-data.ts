import mongoose from 'mongoose';
import { Hospital } from '../../auth-account/models/hospital.model';
import { BloodCenter } from '../../auth-account/models/blood-center.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { User } from '../../auth-account/models/user.model';
import { BloodBag } from '../../blood-inventory/models/blood-bag.model';
import bcrypt from 'bcrypt';

export const seedMockLocationData = async () => {
  try {
    // 1. Hospital: Bệnh viện Chợ Rẫy (Gốc: 106.659616, 10.757826)
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
    // Also update any other hospitals in DB to have location near Chợ Rẫy if missing
    await Hospital.updateMany(
      { $or: [{ location: { $exists: false } }, { 'location.coordinates': { $size: 0 } }] },
      { $set: { location: { type: 'Point', coordinates: [106.659616, 10.757826] } } }
    );
    console.log('[Seed] Upserted mock Hospital & fixed all hospital locations');

    // 2. BloodCenter: Trung tâm Hiến máu Chợ Rẫy (~200m từ BV Chợ Rẫy: 106.658000, 10.759000)
    const mockCenterId = new mongoose.Types.ObjectId('60d21b4667d0d8992e610c85');
    await BloodCenter.updateOne(
      { _id: mockCenterId },
      { $set: {
          name: 'Trung tâm Hiến máu Q5 (MOCK DATA)',
          address: '106 Nguyễn Chí Thanh, Quận 5, TP.HCM',
          location: { type: 'Point', coordinates: [106.658000, 10.759000] },
          contactPhone: '02838685509',
          operatingHours: '07:00 - 16:30'
        }
      },
      { upsert: true }
    );
    // Update all blood centers in DB to be near Chợ Rẫy so GeoNear query finds them
    await BloodCenter.updateMany(
      { _id: { $ne: mockCenterId } },
      { $set: { location: { type: 'Point', coordinates: [106.658000, 10.759000] } } }
    );
    console.log('[Seed] Upserted mock BloodCenter & fixed all blood center locations');

    // Pre-computed valid hash for 'StrongPass123!'
    const passwordHash = '$2b$10$7XZc4rPXtHYQwLj5SAl03Oi9kbwvJ8bzBde9DvIYwF/A9q1k.7zJm';

    await User.updateOne(
      { idDocumentNumber: '079088000456' },
      { $set: {
          email: 'hospital@lifeline.vn',
          passwordHash,
          roles: ['HospitalStaff'],
          role: 'HospitalStaff',
          hospitalId: mockHospitalId,
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
          bloodCenterId: mockCenterId,
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
            permanentAddress: '200 Nguyễn Chí Thanh, Quận 5, TP.HCM',
            bloodType: 'A+',
            location: { type: 'Point', coordinates: [106.660000, 10.758000] },
            emergencyOptIn: true
          }
        },
        { upsert: true }
      );
    }
    
    // Update all existing donor profiles in DB: set emergencyOptIn=true and location near Chợ Rẫy Hospital (~100m - 500m)
    await DonorProfile.updateMany(
      {},
      { 
        $set: { 
          emergencyOptIn: true,
          location: { type: 'Point', coordinates: [106.660000, 10.758000] }
        } 
      }
    );
    console.log('[Seed] Upserted mock Donor user & updated location/emergencyOptIn=true for ALL donors in DB');

    // Seed mock BloodBags for inventory fulfillment testing
    const mockBags = [
      { bagCode: 'BAG-MOCK-A101', bloodType: 'A+', volumeMl: 500 },
      { bagCode: 'BAG-MOCK-A102', bloodType: 'A+', volumeMl: 500 },
      { bagCode: 'BAG-MOCK-O101', bloodType: 'O+', volumeMl: 500 },
      { bagCode: 'BAG-MOCK-B101', bloodType: 'B+', volumeMl: 500 },
    ];
    for (const bag of mockBags) {
      await BloodBag.updateOne(
        { bagCode: bag.bagCode },
        {
          $set: {
            bloodCenterId: mockCenterId,
            bloodType: bag.bloodType,
            volumeMl: bag.volumeMl,
            collectionDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
            storageLocation: 'KHO-COLD-A',
            status: 'Available'
          }
        },
        { upsert: true }
      );
    }
    console.log('[Seed] Upserted mock BloodBags in inventory');

    // Force Mongoose to build 2dsphere indexes immediately
    await Hospital.createIndexes();
    await BloodCenter.createIndexes();
    await DonorProfile.createIndexes();
    console.log('[Seed] Verified 2dsphere geo indexes');

  } catch (error) {
    console.error('[Seed] Mock data error:', error);
  }
};
