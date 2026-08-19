import { Schema, model, Document } from 'mongoose';

export const CURRENT_ROLE_PERMISSIONS_VERSION = 3;

export interface IRole extends Document {
  name: string;
  description: string;
  isSystemProtected: boolean;
  permissions: string[];
  permissionsVersion: number;
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    isSystemProtected: { type: Boolean, default: false },
    permissions: { type: [String], default: [] },
    permissionsVersion: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

export const Role = model<IRole>('Role', roleSchema);
