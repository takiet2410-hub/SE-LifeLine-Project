import mongoose, { Document, Schema } from 'mongoose';

export type NotificationEventType = 
  | 'AppointmentConfirmed'
  | 'AppointmentReminder24h'
  | 'AppointmentReminder2h'
  | 'CampaignPublished'
  | 'DonorEligibilityReached'
  | 'ProfileVerified'
  | 'SOSAlert'
  | 'SOSResponseConfirmed'
  | 'SOSRequestFulfilled'
  | 'AppointmentCancelled'
  | 'AppointmentRescheduled'
  | 'BloodBagStatusChanged'
  | 'CampaignReminder'
  | 'DonationCompleted'
  | 'EligibilityCheckFailed';

import { NotificationChannel } from './Notification';

export interface INotificationTemplate extends Document {
  eventType: NotificationEventType;
  locale: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  channels: NotificationChannel[];
  isActive: boolean;
  variables: string[]; // List of available template variables
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>({
  eventType: { 
    type: String, 
    enum: [
      'AppointmentConfirmed',
      'AppointmentReminder24h',
      'AppointmentReminder2h',
      'CampaignPublished',
      'DonorEligibilityReached',
      'ProfileVerified',
      'SOSAlert',
      'SOSResponseConfirmed',
      'SOSRequestFulfilled',
      'AppointmentCancelled',
      'AppointmentRescheduled',
      'BloodBagStatusChanged',
      'CampaignReminder',
      'DonationCompleted',
      'EligibilityCheckFailed',
    ],
    required: true,
    index: true,
  },
  locale: { type: String, default: 'vi', index: true },
  subject: { type: String, required: true, maxlength: 200 },
  bodyHtml: { type: String, required: true },
  bodyText: { type: String, required: true },
  channels: [{ type: String, enum: ['InApp', 'Email', 'WebPush'], default: ['InApp'] }],
  isActive: { type: Boolean, default: true },
  variables: [{ type: String }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

NotificationTemplateSchema.index({ eventType: 1, locale: 1 }, { unique: true });

export const NotificationTemplate = mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);