import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://nguyenquocduong2006_db_user:9TXhj49vOIUhnMHS@lifeline.exrbuok.mongodb.net/LifeLine?appName=LifeLine';

const CampaignSchema = new mongoose.Schema({
  name: String,
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }
  },
  startDateTime: Date,
  endDateTime: Date,
  capacity: Number,
  registeredCount: Number,
  status: String,
  targetBloodGroups: [String],
  timeSlots: [{
    startTime: String,
    endTime: String,
    capacity: Number,
    registeredCount: Number
  }]
}, { collection: 'campaigns' });

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);

const seedCampaigns = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear old ones
    await Campaign.deleteMany({});
    console.log('Cleared old campaigns.');

    // Create 3 active campaigns for testing
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const timeSlots = [
      { startTime: '08:00', endTime: '09:00', capacity: 10, registeredCount: 0 },
      { startTime: '09:00', endTime: '10:00', capacity: 10, registeredCount: 0 },
      { startTime: '10:00', endTime: '11:00', capacity: 10, registeredCount: 0 },
      { startTime: '13:00', endTime: '14:00', capacity: 10, registeredCount: 0 },
      { startTime: '14:00', endTime: '15:00', capacity: 10, registeredCount: 0 },
      { startTime: '15:00', endTime: '16:00', capacity: 10, registeredCount: 0 }
    ];

    const campaigns = [
      {
        name: 'Cho Ray Hospital - Regular Blood Drive',
        location: {
          type: 'Point',
          coordinates: [106.660172, 10.755498] // Lng, Lat
        },
        startDateTime: now,
        endDateTime: nextMonth,
        capacity: 100,
        registeredCount: 0,
        status: 'Active',
        targetBloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        timeSlots
      },
      {
        name: 'Blood Transfusion Hematology Hospital',
        location: {
          type: 'Point',
          coordinates: [106.666133, 10.756247]
        },
        startDateTime: now,
        endDateTime: nextMonth,
        capacity: 150,
        registeredCount: 0,
        status: 'Active',
        targetBloodGroups: ['A+', 'B+', 'O+', 'O-'],
        timeSlots
      },
      {
        name: 'Tu Du Hospital - Maternity Support',
        location: {
          type: 'Point',
          coordinates: [106.683610, 10.763428]
        },
        startDateTime: now,
        endDateTime: nextMonth,
        capacity: 80,
        registeredCount: 0,
        status: 'Active',
        targetBloodGroups: ['O-', 'AB-'],
        timeSlots
      }
    ];

    await Campaign.insertMany(campaigns);
    console.log('Successfully seeded 3 active campaigns for testing!');
    
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding campaigns:', error);
    process.exit(1);
  }
};

seedCampaigns();
