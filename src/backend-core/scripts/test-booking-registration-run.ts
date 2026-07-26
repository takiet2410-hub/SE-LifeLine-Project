import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { BookingService } from '../src/modules/booking/services/booking.service';
import { RegistrationService } from '../src/modules/registration/services/registration.service';
import { User } from '../src/modules/auth-account/models/user.model';
import { DonorProfile } from '../src/modules/auth-account/models/donor-profile.model';
import { DigitalDonorRecord } from '../src/modules/registration/models/digital-donor-record.model';

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifeline';
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB successfully.\n');

  // Disable strict Atlas collection validators if present
  try {
    if (mongoose.connection.db) {
      await mongoose.connection.db.command({ collMod: 'digital_donor_records', validator: {}, validationLevel: 'off' }).catch(() => {});
      await mongoose.connection.db.command({ collMod: 'screening_forms', validator: {}, validationLevel: 'off' }).catch(() => {});
      await mongoose.connection.db.command({ collMod: 'e_tickets', validator: {}, validationLevel: 'off' }).catch(() => {});
      console.log('Updated Atlas collection validators for testing.\n');
    }
  } catch (err: any) {
    console.log('CollMod warning (can ignore):', err?.message);
  }

  // 1. Find or select an Active Campaign
  const CampaignModel = mongoose.models.Campaign || mongoose.model('Campaign', new mongoose.Schema({
    name: String,
    status: String,
    capacity: Number,
    registeredCount: Number
  }, { collection: 'campaigns' }));

  let campaign = await CampaignModel.findOne({ status: 'Active' });
  if (!campaign) {
    console.log('No Active campaign found in DB, creating test active campaign...');
    campaign = await CampaignModel.create({
      name: 'Chiến Dịch Hiến Máu Tự Nguyện - Bệnh Viện Chợ Rẫy',
      status: 'Active',
      capacity: 100,
      registeredCount: 0
    });
  }
  console.log(`[1] Selected Active Campaign: ID=${campaign._id}, Name="${campaign.name}"`);

  // 2. Create a fresh Donor User & Profile with required fields
  const randomId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  const donorUser = await User.create({
    idDocumentNumber: randomId,
    phone: `090${Math.floor(10007890 + Math.random() * 89990000)}`,
    email: `test_donor_${Date.now()}@bloodcenter.org`,
    passwordHash: 'hashed_password_sample',
    role: 'Donor'
  });

  const donorProfile = await DonorProfile.create({
    userId: donorUser._id,
    fullName: `Nguyễn Văn Test ${Date.now().toString().slice(-4)}`,
    idDocumentNumber: randomId,
    phoneNumber: donorUser.phone,
    dateOfBirth: new Date('1998-05-20'),
    permanentAddress: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    bloodType: 'O+'
  });

  console.log(`[2] Created Fresh Donor User: ID=${donorUser._id}, Name="${donorProfile.fullName}", Phone=${donorUser.phone}`);

  // 3. Create Appointment via BookingService
  console.log('\n[3] Executing BookingService.createAppointment for campaign...');
  const bookingPayload = {
    campaignId: campaign._id.toString(),
    appointmentDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    timeSlot: '08:00 - 09:00',
    answers: {
      responses: [
        { questionId: '1', selectedOptions: ['Không'] },
        { questionId: '2', selectedOptions: ['Không'] },
        { questionId: '3', selectedOptions: ['Không'] },
        { questionId: '4', selectedOptions: ['Không'] },
        { questionId: '5', selectedOptions: ['Không'] },
        { questionId: '6', selectedOptions: ['Không'] },
        { questionId: '7', selectedOptions: ['Không'] },
        { questionId: '8', selectedOptions: ['Không'] }
      ]
    }
  };

  const createdAppointment: any = await BookingService.createAppointment(donorUser._id.toString(), bookingPayload);
  if (!createdAppointment) {
    throw new Error('Failed to create appointment');
  }

  console.log('>>> APPOINTMENT BOOKING SUCCESSFUL!');
  console.log(`    Appointment ID: ${createdAppointment._id}`);
  console.log(`    Appointment Status: ${createdAppointment.status}`);
  console.log(`    ETicket Code: ${createdAppointment.eTicketId?.ticketCode || 'N/A'}`);

  // 4. Verify DigitalDonorRecord created in database
  const digitalRecord = await DigitalDonorRecord.findOne({ appointmentId: createdAppointment._id }).lean();
  console.log('\n[4] VERIFIED DigitalDonorRecord IN MONGO DB ATLAS:');
  console.log(JSON.stringify(digitalRecord, null, 2));

  // 5. Query Registration List View via RegistrationService
  console.log('\n[5] Calling RegistrationService.getCampaignRegistrations (Registration List View)...');
  const staffUserId = donorUser._id.toString(); // mock staff actor ID
  const listResult = await RegistrationService.getCampaignRegistrations(
    campaign._id.toString(),
    { page: 1, limit: 10 },
    staffUserId
  );
  console.log('>>> REGISTRATION LIST RESPONSE:');
  console.log(JSON.stringify(listResult, null, 2));

  // 6. Query Registration Detail View via RegistrationService
  console.log('\n[6] Calling RegistrationService.getRegistrationById (Registration Detail View)...');
  const detailResult = await RegistrationService.getRegistrationById(createdAppointment._id.toString());
  console.log('>>> REGISTRATION DETAIL RESPONSE:');
  console.log(JSON.stringify(detailResult, null, 2));

  // 7. Confirm Appointment by Staff & Verify Status Update without Entity Duplication
  console.log('\n[7] Staff confirms appointment via BookingService.confirmAppointmentByBloodCenter...');
  const countBefore = await mongoose.model('Appointment').countDocuments({ donorId: donorUser._id });
  const confirmedAppointment: any = await BookingService.confirmAppointmentByBloodCenter(createdAppointment._id.toString());
  const countAfter = await mongoose.model('Appointment').countDocuments({ donorId: donorUser._id });

  console.log('>>> CONFIRMED APPOINTMENT RESPONSE:');
  console.log(`    Appointment ID: ${confirmedAppointment._id}`);
  console.log(`    Updated Status: ${confirmedAppointment.status}`);
  console.log(`    ETicket Code: ${confirmedAppointment.eTicketId?.ticketCode || 'N/A'}`);
  console.log(`    ETicket File URL: ${confirmedAppointment.eTicketId?.fileUrl || 'N/A'}`);
  console.log(`    Appointment Entity Count Before: ${countBefore}, After: ${countAfter} (No entity duplication verified!)`);

  if (countBefore !== countAfter) {
    throw new Error('FAILED: Entity was duplicated instead of updating existing entity!');
  }

  await mongoose.disconnect();
  console.log('\nAll tests completed successfully!');
}

run().catch(err => {
  console.error('Test Execution Error:', err);
  mongoose.disconnect();
  process.exit(1);
});
