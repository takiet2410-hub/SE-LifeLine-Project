// src/modules/auth-account/models/user.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  idDocumentNumber: string;
  email: string;
  fullName?: string;
  phone?: string;
  passwordHash: string;
  roles: ('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[];
  role?: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';
  accountStatus: 'PendingVerification' | 'Active' | 'Suspended';
  failedLoginAttempts: number;
  lockUntil?: Date;

  // Dành cho luồng Đăng ký & Xác minh Email
  verificationToken?: string; 
  verificationTokenExpiry?: Date;
  
  // Dành cho luồng Quên mật khẩu
  resetToken?: string; 
  resetTokenExpiry?: Date;

  // BloodCenterStaff only
  bloodCenterId?: Types.ObjectId;

  // HospitalStaff only
  hospitalId?: Types.ObjectId;

  lastLoginAt?: Date;
  sessionExpiresAt?: Date;
  permanentAddress?: string;
  currentAddress?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  deletionReason?: string;
  privacyPurgedAt?: Date;
  privacyPurgedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  idDocumentNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, trim: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
  roles: {
    type: [String],
    enum: ['Donor', 'BloodCenterStaff', 'HospitalStaff', 'Administrator'],
    required: true,
    default: ['Donor'],
  },
  role: { 
    type: String, 
    enum: ['Donor', 'BloodCenterStaff', 'HospitalStaff', 'Administrator'],
  },
  accountStatus: { 
    type: String, 
    enum: ['PendingVerification', 'Active', 'Suspended'], // Đổi Locked -> Suspended
    default: 'PendingVerification',
    required: true
  },
  failedLoginAttempts: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 10 // Bổ sung giới hạn theo JSON Schema
  },
  lockUntil: { type: Date },

  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  resetToken: { type: String, index: true }, // Đánh index để truy vấn nhanh khi reset password
  resetTokenExpiry: { type: Date },

  bloodCenterId: { type: Schema.Types.ObjectId, ref: 'BloodCenter', index: true },
  hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', index: true },
  
  lastLoginAt: { type: Date },
  sessionExpiresAt: { type: Date },
  permanentAddress: { type: String },
  currentAddress: { type: String },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  deletedBy: { type: String },
  deletionReason: { type: String },
  privacyPurgedAt: { type: Date },
  privacyPurgedBy: { type: String }
}, {
  timestamps: true // Tự động quản lý createdAt và updatedAt
});

// Auto-sync hook: Ensure role and roles are always bidirectionally consistent
userSchema.pre('validate', function() {
  if (Array.isArray(this.roles) && this.roles.length > 0) {
    // Normalize unique roles
    this.roles = Array.from(new Set(['Donor', ...this.roles])) as any;
    if (!this.role || !this.roles.includes(this.role)) {
      if (this.roles.includes('Administrator')) this.role = 'Administrator';
      else if (this.roles.includes('BloodCenterStaff')) this.role = 'BloodCenterStaff';
      else if (this.roles.includes('HospitalStaff')) this.role = 'HospitalStaff';
      else this.role = this.roles[0] || 'Donor';
    }
  } else if (this.role) {
    this.roles = this.role === 'Donor' ? ['Donor'] : ['Donor', this.role];
  } else {
    this.roles = ['Donor'];
    this.role = 'Donor';
  }
});

export const User = model<IUser>('User', userSchema);
