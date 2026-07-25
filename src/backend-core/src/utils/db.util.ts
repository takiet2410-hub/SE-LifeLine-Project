import mongoose from 'mongoose';
import { env } from '../config/env.config';

export const connectDB = async (): Promise<void> => {
  try {
    console.log('MONGODB_URI:', env.MONGODB_URI);
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
