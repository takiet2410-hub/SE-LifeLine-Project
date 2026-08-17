import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { BloodCenter } from '../../auth-account/models/blood-center.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { Hospital } from '../../auth-account/models/hospital.model';
import { User } from '../../auth-account/models/user.model';
import { BloodBag } from '../../blood-inventory/models/blood-bag.model';

export const DEMO_PASSWORD = 'Password123!';

const DEMO_IDS = {
  bloodCenter: new Types.ObjectId('60d21b4667d0d8992e610c85'),
  choRayHospital: new Types.ObjectId('60d21b4667d0d8992e610c86'),
  hospital115: new Types.ObjectId('60d21b4667d0d8992e610c87'),
};

type DemoRole = 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';

type DemoAccount = {
  email: string;
  idDocumentNumber: string;
  fullName: string;
  phone: string;
  role: DemoRole;
  hospitalId?: Types.ObjectId;
  bloodCenterId?: Types.ObjectId;
  donor?: {
    bloodType: 'O+' | 'O-' | 'AB+';
    address: string;
    coordinates: [number, number];
  };
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'donor@lifeline.vn',
    idDocumentNumber: '079099000998',
    fullName: 'Nguyễn Văn Donor (Quận 1)',
    phone: '0901234567',
    role: 'Donor',
    donor: {
      bloodType: 'O+',
      address: 'Phường Bến Thành, Quận 1, TP.HCM',
      coordinates: [106.6983, 10.7719],
    },
  },
  {
    email: 'donor.o_minus@lifeline.vn',
    idDocumentNumber: '079099000888',
    fullName: 'Trần Thị Donor (Máu O- Khẩn Cấp)',
    phone: '0901234568',
    role: 'Donor',
    donor: {
      bloodType: 'O-',
      address: 'Phường 12, Quận 5, TP.HCM',
      coordinates: [106.6597, 10.7554],
    },
  },
  {
    email: 'donor.ab@lifeline.vn',
    idDocumentNumber: '079099000777',
    fullName: 'Lê Hoàng Donor (Quận 10)',
    phone: '0901234569',
    role: 'Donor',
    donor: {
      bloodType: 'AB+',
      address: 'Phường 12, Quận 10, TP.HCM',
      coordinates: [106.6667, 10.7733],
    },
  },
  {
    email: 'hospital@lifeline.vn',
    idDocumentNumber: '079088000456',
    fullName: 'Bác Sĩ Cấp Cứu (BV Chợ Rẫy)',
    phone: '0908123457',
    role: 'HospitalStaff',
    hospitalId: DEMO_IDS.choRayHospital,
  },
  {
    email: 'hospital.115@lifeline.vn',
    idDocumentNumber: '079088000458',
    fullName: 'Bác Sĩ Trực Cấp Cứu (BV 115)',
    phone: '0908123458',
    role: 'HospitalStaff',
    hospitalId: DEMO_IDS.hospital115,
  },
  {
    email: 'bloodcenter@lifeline.vn',
    idDocumentNumber: '079099000112',
    fullName: 'Bác Sĩ Ngân Hàng Máu',
    phone: '0909123112',
    role: 'BloodCenterStaff',
    bloodCenterId: DEMO_IDS.bloodCenter,
  },
  {
    email: 'admin@lifeline.gov.vn',
    idDocumentNumber: '079077000790',
    fullName: 'Quản Trị Viên Hệ Thống',
    phone: '0907123457',
    role: 'Administrator',
  },
];

export const DEMO_ACCOUNT_SUMMARY = DEMO_ACCOUNTS.map(({ email, idDocumentNumber, role }) => ({
  email,
  idDocumentNumber,
  role,
}));

async function seedOrganizations() {
  const existingChoRay = await Hospital.findOne({
    name: 'Bệnh viện Chợ Rẫy (Khoa Cấp Cứu)',
  }).select('_id');
  const choRay = await Hospital.findOneAndUpdate(
    { _id: existingChoRay?._id ?? DEMO_IDS.choRayHospital },
    {
      $set: {
        name: 'Bệnh viện Chợ Rẫy (Khoa Cấp Cứu)',
        address: '201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM',
        location: { type: 'Point', coordinates: [106.6597, 10.7554] },
        contactPhone: '02838554137',
        isVerified: true,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  const existingHospital115 = await Hospital.findOne({
    name: 'Bệnh viện Nhân Dân 115',
  }).select('_id');
  const hospital115 = await Hospital.findOneAndUpdate(
    { _id: existingHospital115?._id ?? DEMO_IDS.hospital115 },
    {
      $set: {
        name: 'Bệnh viện Nhân Dân 115',
        address: '527 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM',
        location: { type: 'Point', coordinates: [106.6667, 10.7733] },
        contactPhone: '02838654139',
        isVerified: true,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  const existingBloodCenter = await BloodCenter.findOne({
    name: 'Trung tâm Truyền máu Huyết học TP.HCM',
  }).select('_id');
  const bloodCenter = await BloodCenter.findOneAndUpdate(
    { _id: existingBloodCenter?._id ?? DEMO_IDS.bloodCenter },
    {
      $set: {
        name: 'Trung tâm Truyền máu Huyết học TP.HCM',
        address: '118 Hồng Bàng, Phường 12, Quận 5, TP.HCM',
        location: { type: 'Point', coordinates: [106.6622, 10.7594] },
        contactPhone: '02839571342',
        operatingHours: '07:00 - 17:00 (Thứ 2 - Chủ Nhật)',
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  return {
    choRayHospitalId: choRay._id as Types.ObjectId,
    hospital115Id: hospital115._id as Types.ObjectId,
    bloodCenterId: bloodCenter._id as Types.ObjectId,
  };
}

async function seedAccount(account: DemoAccount, passwordHash: string) {
  const conflictingUser = await User.findOne({
    idDocumentNumber: account.idDocumentNumber,
    email: { $ne: account.email },
  }).select('_id email');

  if (conflictingUser) {
    throw new Error(
      `CCCD ${account.idDocumentNumber} đang thuộc tài khoản ${conflictingUser.email}; không thể seed ${account.email}.`
    );
  }

  const user = await User.findOneAndUpdate(
    { email: account.email },
    {
      $set: {
        idDocumentNumber: account.idDocumentNumber,
        fullName: account.fullName,
        phone: account.phone,
        passwordHash,
        roles: [account.role],
        role: account.role,
        hospitalId: account.hospitalId,
        bloodCenterId: account.bloodCenterId,
        accountStatus: 'Active',
        failedLoginAttempts: 0,
      },
      $unset: { lockUntil: 1 },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
  );

  if (account.donor) {
    await DonorProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          fullName: account.fullName,
          email: account.email,
          dateOfBirth: new Date('1998-05-15'),
          idDocumentNumber: account.idDocumentNumber,
          phoneNumber: account.phone,
          permanentAddress: account.donor.address,
          bloodType: account.donor.bloodType,
          location: { type: 'Point', coordinates: account.donor.coordinates },
          emergencyOptIn: true,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
    );
  }

  console.log(`[Seed] Upserted ${account.role}: ${account.email}`);
}

async function seedBloodBags(bloodCenterId: Types.ObjectId) {
  const mockBags = [
    { bagCode: 'BAG-DEMO-A101', bloodType: 'A+', volumeMl: 500 },
    { bagCode: 'BAG-DEMO-A102', bloodType: 'A+', volumeMl: 500 },
    { bagCode: 'BAG-DEMO-O101', bloodType: 'O+', volumeMl: 500 },
    { bagCode: 'BAG-DEMO-B101', bloodType: 'B+', volumeMl: 500 },
  ];

  for (const bag of mockBags) {
    await BloodBag.findOneAndUpdate(
      { bagCode: bag.bagCode },
      {
        $set: {
          bloodCenterId,
          bloodType: bag.bloodType,
          volumeMl: bag.volumeMl,
          collectionDate: new Date(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          storageLocation: 'KHO-DEMO-A',
          status: 'Available',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
    );
  }

  console.log('[Seed] Upserted demo blood bags');
}

export const seedMockLocationData = async () => {
  const organizations = await seedOrganizations();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const sourceAccount of DEMO_ACCOUNTS) {
    const account = { ...sourceAccount };
    if (account.email === 'hospital@lifeline.vn') {
      account.hospitalId = organizations.choRayHospitalId;
    } else if (account.email === 'hospital.115@lifeline.vn') {
      account.hospitalId = organizations.hospital115Id;
    } else if (account.email === 'bloodcenter@lifeline.vn') {
      account.bloodCenterId = organizations.bloodCenterId;
    }
    await seedAccount(account, passwordHash);
  }

  await seedBloodBags(organizations.bloodCenterId);
  await Promise.all([
    Hospital.createIndexes(),
    BloodCenter.createIndexes(),
    DonorProfile.createIndexes(),
  ]);

  console.log('[Seed] Demo data is ready. Password for all demo accounts: Password123!');
};
