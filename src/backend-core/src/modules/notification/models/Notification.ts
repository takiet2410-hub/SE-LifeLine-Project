import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'Routine' | 'SOS' | 'Campaign' | 'System';
export type NotificationChannel = 'Email' | 'WebPush';
export type DeliveryStatus = 'Pending' | 'Sent' | 'Failed' | 'Retried';
export type SourceRefType = 'Appointment' | 'Campaign' | 'SOSRequest' | 'Article';

export interface INotification extends Document {
  recipientUserId: mongoose.Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  payload?: Record<string, any>;
  sourceRefId: mongoose.Types.ObjectId;
  sourceRefType: SourceRefType;
  deliveryStatus: DeliveryStatus;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['Routine', 'SOS', 'Campaign', 'System'], required: true, index: true },
  channel: { type: String, enum: ['Email', 'WebPush'], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  sourceRefId: { type: Schema.Types.ObjectId, required: true },
  sourceRefType: { type: String, enum: ['Appointment', 'Campaign', 'SOSRequest', 'Article'], required: true },
  deliveryStatus: { type: String, enum: ['Pending', 'Sent', 'Failed', 'Retried'], default: 'Pending', index: true },
  readAt: { type: Date, default: null, index: true }
}, {
  timestamps: true,
  collection: 'notifications'
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);