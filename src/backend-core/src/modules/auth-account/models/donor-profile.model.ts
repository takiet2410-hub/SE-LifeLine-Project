// src/modules/auth-account/models/donor-profile.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IDonorProfile extends Document {
  userId: Types.ObjectId;
  fullName: string;
  dateOfBirth: Date;
  idDocumentNumber: string;
  phoneNumber: string;
  permanentAddress: string;
  currentAddress?: Record<string, any>; // THÊM TRƯỜNG NÀY
  location?: {
    type: string;
    coordinates: number[];
  };
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  lastDonationDate?: Date;
  totalDonations: number;
  xp: number;
  donorLevel: number;
  emergencyOptIn: boolean;
  avatarUrl: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other';
  achievements?: Array<{
    badgeType: string;
    title: string;
    description: string;
    icon: string;
    awardedAt: Date;
  }>;
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
  currentAddress: { type: Schema.Types.Mixed },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }
  },
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
  emergencyOptIn: { type: Boolean, default: true },
  avatarUrl: { type: String, default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' },
  
  email: { type: String },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'] 
  },
  achievements: [{
    badgeType: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    awardedAt: { type: Date, required: true }
  }]
}, {
  timestamps: true,
  collection: 'donor_profiles'
});

// Self-cleaning hook: Sanitize incomplete or invalid GeoJSON locations
donorProfileSchema.pre('validate', function() {
  if (this.location) {
    const coords = this.location.coordinates;
    const isValidCoords = Array.isArray(coords) &&
      coords.length === 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number' &&
      !isNaN(coords[0]) &&
      !isNaN(coords[1]);

    if (!isValidCoords) {
      this.location = undefined;
    } else {
      this.location.type = 'Point';
    }
  }
});

donorProfileSchema.index({ location: '2dsphere' });

export const DonorProfile = model<IDonorProfile>('DonorProfile', donorProfileSchema);