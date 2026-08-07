import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDevice extends Document {
  userId: mongoose.Types.ObjectId;
  fcmToken: string;
  deviceType: string;
  platform: string; // 'web', 'android', 'ios'
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserDeviceSchema = new Schema<IUserDevice>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fcmToken: { type: String, required: true },
  deviceType: { type: String, default: 'Unknown' },
  platform: { type: String, default: 'web' },
  lastActiveAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'user_devices'
});

// Prevent duplicate tokens for the same user
UserDeviceSchema.index({ userId: 1, fcmToken: 1 }, { unique: true });

export const UserDevice = mongoose.model<IUserDevice>('UserDevice', UserDeviceSchema);
