import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function cleanup() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifeline';
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.\n');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('No DB connection');
    process.exit(1);
  }

  // Find all campaigns with "Chợ Rẫy" or test campaigns
  const choRayCampaigns = await db.collection('campaigns').find({
    name: { $regex: /Chợ Rẫy/i }
  }).toArray();

  console.log(`Found ${choRayCampaigns.length} Chợ Rẫy campaigns:`);
  const campaignIds = choRayCampaigns.map(c => c._id);
  choRayCampaigns.forEach(c => console.log(' - ID:', c._id.toString(), '| Name:', c.name));

  // Find test users/donors with "test_donor_" or "Nguyễn Văn Test"
  const testUsers = await db.collection('users').find({
    $or: [
      { email: { $regex: /test_donor_/i } },
      { fullName: { $regex: /Test/i } }
    ]
  }).toArray();
  const testUserIds = testUsers.map(u => u._id);
  console.log(`Found ${testUsers.length} test donor users.`);

  const testProfiles = await db.collection('donor_profiles').find({
    $or: [
      { userId: { $in: testUserIds } },
      { fullName: { $regex: /Test/i } }
    ]
  }).toArray();
  const testProfileUserIds = testProfiles.map(p => p.userId);

  // Find appointments under Chợ Rẫy campaigns or test users
  const testAppointments = await db.collection('appointments').find({
    $or: [
      { campaignId: { $in: campaignIds } },
      { donorId: { $in: [...testUserIds, ...testProfileUserIds] } }
    ]
  }).toArray();
  const testAppointmentIds = testAppointments.map(a => a._id);

  console.log(`Found ${testAppointments.length} test appointments to clean up.`);

  if (testAppointments.length > 0) {
    const deletedAppointments = await db.collection('appointments').deleteMany({ _id: { $in: testAppointmentIds } });
    console.log(`Deleted ${deletedAppointments.deletedCount} appointments.`);

    const deletedScreening = await db.collection('screening_forms').deleteMany({
      $or: [
        { appointmentId: { $in: testAppointmentIds } },
        { appointmentId: { $in: testAppointmentIds.map(id => id.toString()) } }
      ]
    });
    console.log(`Deleted ${deletedScreening.deletedCount} screening forms.`);

    const deletedRecords = await db.collection('digital_donor_records').deleteMany({
      $or: [
        { appointmentId: { $in: testAppointmentIds } },
        { appointmentId: { $in: testAppointmentIds.map(id => id.toString()) } }
      ]
    });
    console.log(`Deleted ${deletedRecords.deletedCount} digital donor records.`);

    const deletedTickets = await db.collection('e_tickets').deleteMany({
      $or: [
        { appointmentId: { $in: testAppointmentIds } },
        { appointmentId: { $in: testAppointmentIds.map(id => id.toString()) } }
      ]
    });
    console.log(`Deleted ${deletedTickets.deletedCount} e-tickets.`);

    const deletedProfiles = await db.collection('donor_profiles').deleteMany({
      $or: [
        { userId: { $in: testUserIds } },
        { fullName: { $regex: /Test/i } }
      ]
    });
    console.log(`Deleted ${deletedProfiles.deletedCount} test donor profiles.`);

    const deletedUsers = await db.collection('users').deleteMany({ _id: { $in: testUserIds } });
    console.log(`Deleted ${deletedUsers.deletedCount} test users.`);

    // Reset registeredCount on campaigns if needed
    for (const campId of campaignIds) {
      await db.collection('campaigns').updateOne({ _id: campId }, { $set: { registeredCount: 0 } });
    }
  }

  console.log('\nCleanup completed successfully!');
  await mongoose.disconnect();
}

cleanup().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
