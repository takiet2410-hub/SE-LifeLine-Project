import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'Routine' | 'SOS' | 'Campaign' | 'System' | 'Appointment';
export type NotificationChannel = 'Email' | 'WebPush' | 'InApp';
export type DeliveryStatus = 'Pending' | 'Sending' | 'Sent' | 'Failed' | 'Retried';
export type SourceRefType = 'Appointment' | 'Campaign' | 'SOSRequest' | 'Article' | 'System';

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
  retryCount: number;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['Routine', 'SOS', 'Campaign', 'System', 'Appointment'], required: true, index: true },
  channel: { type: String, enum: ['Email', 'WebPush', 'InApp'], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  sourceRefId: { type: Schema.Types.ObjectId, required: true },
  sourceRefType: { type: String, enum: ['Appointment', 'Campaign', 'SOSRequest', 'Article', 'System'], required: true },
  deliveryStatus: { type: String, enum: ['Pending', 'Sending', 'Sent', 'Failed', 'Retried'], default: 'Pending', index: true },
  retryCount: { type: Number, default: 0, min: 0 },
  readAt: { type: Date, default: null, index: true }
}, {
  timestamps: true,
  collection: 'notifications'
});

// Compound index for efficient queries (NOT unique - allows re-broadcast)
NotificationSchema.index({ recipientUserId: 1, sourceRefId: 1, sourceRefType: 1 });
NotificationSchema.index({ recipientUserId: 1, sourceRefId: 1, channel: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
