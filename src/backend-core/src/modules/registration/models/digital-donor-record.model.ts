import mongoose, { Document, Schema } from 'mongoose';

export type DonationStatusType = 'Pending' | 'Confirmed' | 'Rejected' | 'CheckedIn' | 'Eligible' | 'Ineligible' | 'Completed';

export interface IDigitalDonorRecord extends Document {
  appointmentId: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  screeningSummary?: Record<string, any>;
  donationStatus: DonationStatusType;
  clinicalNotes?: string;
  lastUpdatedAt: Date;
}

const DigitalDonorRecordSchema: Schema = new Schema({
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
  donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  screeningSummary: { type: Schema.Types.Mixed, default: {} },
  donationStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Rejected', 'CheckedIn', 'Eligible', 'Ineligible', 'Completed'],
    default: 'Pending',
    required: true,
  },
  clinicalNotes: { type: String, default: '' },
  lastUpdatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'digital_donor_records'
});

export const DigitalDonorRecord = mongoose.model<IDigitalDonorRecord>('DigitalDonorRecord', DigitalDonorRecordSchema);
