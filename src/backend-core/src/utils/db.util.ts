import mongoose from 'mongoose';
import { env } from '../config/env.config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Remove strict legacy MongoDB Atlas collection validators across all collections
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const coll of collections) {
        await mongoose.connection.db.command({
          collMod: coll.name,
          validator: {},
          validationLevel: 'off'
        }).catch(() => {});
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
