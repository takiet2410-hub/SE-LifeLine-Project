import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  idDocumentNumber: string;
  email: string;
  passwordHash: string;
  accountStatus: 'PendingVerification' | 'Active' | 'Locked';
  failedLoginAttempts: number;
  lockUntil?: Date;
  otp?: string;
  otpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  idDocumentNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  accountStatus: { type: String, enum: ['PendingVerification', 'Active', 'Locked'], default: 'PendingVerification' },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  otp: { type: String },
  otpExpiry: { type: Date }
}, {
  timestamps: true
});

export const User = model<IUser>('User', userSchema);
