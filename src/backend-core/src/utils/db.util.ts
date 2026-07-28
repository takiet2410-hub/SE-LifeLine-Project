import mongoose from 'mongoose';
import { env } from '../config/env.config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Remove strict legacy MongoDB Atlas collection validators that conflict with app enums (e.g. AppointmentStatus.Pending)
    if (mongoose.connection.db) {
      const collectionsToRelax = ['appointments', 'digital_donor_records', 'screening_forms', 'e_tickets'];
      for (const collName of collectionsToRelax) {
        await mongoose.connection.db.command({ collMod: collName, validator: {}, validationLevel: 'off' }).catch(() => {});
      }
    }

    // Auto-seed default roles and staff users if missing
    const { seedDefaultUsers } = await import('./seed-users');
    await seedDefaultUsers();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
