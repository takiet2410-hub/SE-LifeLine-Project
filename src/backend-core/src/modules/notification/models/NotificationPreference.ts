import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationPreference extends Document {
  donorId: mongoose.Types.ObjectId;
  sosEnabled: boolean;
  appointmentEnabled: boolean;
  campaignEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>({
  donorId: { type: Schema.Types.ObjectId, ref: 'DonorProfile', required: true, unique: true, index: true },
  sosEnabled: { type: Boolean, default: true },
  appointmentEnabled: { type: Boolean, default: true },
  campaignEnabled: { type: Boolean, default: true },
  emailEnabled: { type: Boolean, default: true },
  pushEnabled: { type: Boolean, default: true },
  quietHoursStart: { type: String, default: null },
  quietHoursEnd: { type: String, default: null },
  timezone: { type: String, default: 'Asia/Ho_Chi_Minh' }
}, {
  timestamps: true,
  collection: 'notification_preferences'
});

export const NotificationPreference = mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);