import { Schema, model, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  isSystemProtected: boolean;
  permissions: string[];
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
  },
  {
    timestamps: true,
  }
);

export const Role = model<IRole>('Role', roleSchema);
