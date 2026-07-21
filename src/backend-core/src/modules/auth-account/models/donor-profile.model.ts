import { Schema, model, Document, Types } from 'mongoose';

export interface IDonorProfile extends Document {
  userId: Types.ObjectId;
  fullName: string;
  dateOfBirth: Date;
  idDocumentNumber: string;
  phoneNumber: string;
  address?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  createdAt: Date;
  updatedAt: Date;
}

const donorProfileSchema = new Schema<IDonorProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  idDocumentNumber: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String },
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }
}, {
  timestamps: true,
  collection: 'donor_profiles'
});

export const DonorProfile = model<IDonorProfile>('DonorProfile', donorProfileSchema);
