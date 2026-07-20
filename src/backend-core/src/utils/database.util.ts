import mongoose from 'mongoose';
import { env } from '../config/env.config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);

    console.log('✅ MongoDB connected successfully');
    console.log('URI:', env.MONGODB_URI);

    if (mongoose.connection.db) {
      console.log('Database:', mongoose.connection.db.databaseName);
      console.log('Host:', mongoose.connection.host);

      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();

      console.log(
        'Collections:',
        collections.map(c => c.name)
      );
    }

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};