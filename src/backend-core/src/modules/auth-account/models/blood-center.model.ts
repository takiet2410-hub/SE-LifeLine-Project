import { Schema, model, Document } from 'mongoose';

export interface IBloodCenter extends Document {
  name: string;
  address: string;
  location: {
    type: string;
    coordinates: number[];
  };
  contactPhone: string;
  operatingHours: string;
  createdAt: Date;
  updatedAt: Date;
}

const bloodCenterSchema = new Schema<IBloodCenter>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  contactPhone: { type: String, required: true },
  operatingHours: { type: String, required: true }
}, {
  timestamps: true,
  collection: 'blood_centers'
});

bloodCenterSchema.index({ location: '2dsphere' });

export const BloodCenter = model<IBloodCenter>('BloodCenter', bloodCenterSchema);
