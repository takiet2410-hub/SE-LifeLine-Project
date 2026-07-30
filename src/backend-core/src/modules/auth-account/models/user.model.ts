// src/modules/auth-account/models/user.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  idDocumentNumber: string;
  email: string;
  phone?: string;
  passwordHash: string;
  roles: ('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[];
  role?: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';
  accountStatus: 'PendingVerification' | 'Active' | 'Suspended';
  failedLoginAttempts: number;
  lockUntil?: Date; // Giữ lại phục vụ cho logic khóa tài khoản tạm thời

  // Dành cho luồng Đăng ký & Xác minh Email
  verificationToken?: string; 
  verificationTokenExpiry?: Date;
  
  // Dành cho luồng Quên mật khẩu
  resetToken?: string; 
  resetTokenExpiry?: Date;

  lastLoginAt?: Date;
  sessionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  idDocumentNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
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
  
  lastLoginAt: { type: Date },
  sessionExpiresAt: { type: Date }
}, {
  timestamps: true // Tự động quản lý createdAt và updatedAt
});

export const User = model<IUser>('User', userSchema);