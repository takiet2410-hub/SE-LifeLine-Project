import { Schema, model, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  value: any;
  category: 'Eligibility Rules' | 'Campaign Settings' | 'Notification Settings' | 'General';
  label: string;
  description?: string;
  unit?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    category: {
      type: String,
      enum: ['Eligibility Rules', 'Campaign Settings', 'Notification Settings', 'General'],
      required: true,
      index: true,
    },
    label: { type: String, required: true },
    description: { type: String },
    unit: { type: String },
    updatedBy: { type: String },
  },
  {
    timestamps: true,
  }
);

export const SystemConfig = model<ISystemConfig>('SystemConfig', systemConfigSchema);
