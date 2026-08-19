import { Schema, model, Document } from 'mongoose';

export interface IHospital extends Document {
  name: string;
  address: string;
  location: {
    type: string;
    coordinates: number[];
  };
  contactPhone: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hospitalSchema = new Schema<IHospital>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  contactPhone: { type: String, required: true },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'hospitals'
});

hospitalSchema.index({ location: '2dsphere' });

export const Hospital = model<IHospital>('Hospital', hospitalSchema);
