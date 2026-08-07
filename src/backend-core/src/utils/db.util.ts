import mongoose from 'mongoose';
import { env } from '../config/env.config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    /* collection validator override done during setup */

    const { seedNotificationTemplates } = await import('../modules/notification/services/notification.templates');
    await seedNotificationTemplates();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
