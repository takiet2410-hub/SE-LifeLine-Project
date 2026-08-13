import { Schema, model, Document } from 'mongoose';

export interface IFeatureToggle extends Document {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  dependencies?: string[];
  affectedServices?: string[];
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const featureToggleSchema = new Schema<IFeatureToggle>(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    isEnabled: { type: Boolean, default: true },
    dependencies: { type: [String], default: [] },
    affectedServices: { type: [String], default: [] },
    updatedBy: { type: String },
  },
  {
    timestamps: true,
  }
);

export const FeatureToggle = model<IFeatureToggle>('FeatureToggle', featureToggleSchema);
