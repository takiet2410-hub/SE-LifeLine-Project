import { Schema, model, Document } from 'mongoose';

export interface ICampaign extends Document {
  bloodCenterId: string;
  name: string;
  venue: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  startDateTime: Date;
  endDateTime: Date;
  targetBloodGroups: string[];
  capacity: number;
  registeredCount: number;
  status: 'Draft' | 'Active' | 'Full' | 'Closed' | 'Cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    bloodCenterId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    startDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    endDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    targetBloodGroups: {
      type: [String],
      required: true,
      enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Full', 'Closed', 'Cancelled'],
      default: 'Draft',
      required: true,
    },
  },
  { timestamps: true }
);

// Create 2dsphere index for geospatial queries
campaignSchema.index({ 'location.coordinates': '2dsphere' });

const Campaign = model<ICampaign>('Campaign', campaignSchema);

export default Campaign;
