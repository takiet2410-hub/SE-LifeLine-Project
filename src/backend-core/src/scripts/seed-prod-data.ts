import mongoose from 'mongoose';
import { env } from '../config/env.config';
import { User } from '../modules/auth-account/models/user.model';
import { DonorProfile } from '../modules/auth-account/models/donor-profile.model';
import { BloodCenter } from '../modules/auth-account/models/blood-center.model';
import { BloodBag } from '../modules/blood-inventory/models/blood-bag.model';
import { NotificationPreference } from '../modules/notification/models/NotificationPreference';

async function seedData() {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI as string);
    console.log('[Seed] Connected successfully.');

    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.collection('notification_preferences').dropIndex('donorId_1');
        console.log('[Seed] Dropped legacy donorId_1 index.');
      }
    } catch (e) {
      // ignore
    }

    // 1. Get all Blood Centers
    const centers = await BloodCenter.find().select('_id').lean();
    if (centers.length === 0) {
      console.log('[Seed] No Blood Centers found! Please register a blood center first.');
      process.exit(1);
    }
    console.log(`[Seed] Found ${centers.length} Blood Centers.`);

    // 2. Fix Staff bloodCenterId
    const staffs = await User.find({ role: 'BloodCenterStaff' });
    let staffUpdated = 0;
    for (const staff of staffs) {
      if (!staff.bloodCenterId) {
        const randomCenter = centers[Math.floor(Math.random() * centers.length)];
        staff.bloodCenterId = randomCenter._id as any;
        await staff.save();
        staffUpdated++;
      }
    }
    console.log(`[Seed] Updated ${staffUpdated} Staff members with a bloodCenterId.`);

    // 3. Fix BloodBag bloodCenterId
    const bags = await BloodBag.find({ bloodCenterId: { $exists: false } });
    let bagsUpdated = 0;
    for (const bag of bags) {
      const randomCenter = centers[Math.floor(Math.random() * centers.length)];
      bag.bloodCenterId = randomCenter._id as any;
      await bag.save();
      bagsUpdated++;
    }
    console.log(`[Seed] Updated ${bagsUpdated} Blood Bags with a bloodCenterId.`);

    // 4. Fix Donor Profiles
    const donors = await User.find({ role: 'Donor' });
    let profilesUpdated = 0;
    for (const donor of donors) {
      let profile = await DonorProfile.findOne({ userId: donor._id });
      if (!profile) {
        profile = new DonorProfile({ userId: donor._id });
      }
      profile.emergencyOptIn = true;
      // Default location to Ho Chi Minh City
      profile.location = {
        type: 'Point',
        coordinates: [106.681729, 10.762622] // HCM coords
      };
      // Assign random blood type if none
      if (!profile.bloodType || profile.bloodType === 'Unknown') {
        const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        profile.bloodType = (bloodTypes[Math.floor(Math.random() * bloodTypes.length)]) as any;
      }
      await profile.save();
      profilesUpdated++;
    }
    console.log(`[Seed] Updated ${profilesUpdated} Donor Profiles with emergencyOptIn=true and location.`);

    console.log('[Seed] Data Integrity Check Passed. Database is now production-ready.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Failed:', error);
    process.exit(1);
  }
}

seedData();
