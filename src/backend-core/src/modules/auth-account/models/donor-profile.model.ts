// src/modules/auth-account/models/donor-profile.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IDonorProfile extends Document {
  userId: Types.ObjectId;
  fullName: string;
  dateOfBirth: Date;
  idDocumentNumber: string;
  phoneNumber: string;
  permanentAddress: string;
  location?: Record<string, any>;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  lastDonationDate?: Date;
  totalDonations: number;
  xp: number;
  donorLevel: number;
  emergencyOptIn: boolean;
  avatarUrl: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other';
  createdAt: Date;
  updatedAt: Date;
}

const donorProfileSchema = new Schema<IDonorProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  idDocumentNumber: { type: String, required: true }, 
  phoneNumber: { type: String, required: true },
  permanentAddress: { type: String, required: true },
  location: { type: Schema.Types.Mixed },
  bloodType: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown',
    required: true
  },
  lastDonationDate: { type: Date }, // Không bắt buộc, để trống nếu chưa có lịch sử hiến
  
  // --- THÊM CÁC GIÁ TRỊ DEFAULT ĐỂ KHỚP VỚI MONGODB VALIDATION ---
  totalDonations: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  donorLevel: { type: Number, default: 1 },
  emergencyOptIn: { type: Boolean, default: false },
  avatarUrl: { type: String, default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' },
  
  email: { type: String },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'] 
  }
}, {
  timestamps: true,
  collection: 'donor_profiles'
});

export const DonorProfile = model<IDonorProfile>('DonorProfile', donorProfileSchema);