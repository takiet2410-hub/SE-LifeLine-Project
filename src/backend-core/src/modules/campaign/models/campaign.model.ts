import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaign extends Document {
  campaignCode: string;
  name: string;
  description?: string;
  venue: string;
  fullAddress: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  startDateTime: Date;
  endDateTime: Date;
  targetBloodGroups: string[];
  capacity: number;
  registeredCount: number;
  targetUnitsGoal: number;
  contactPerson: {
    name: string;
    phone: string;
  };
  internalRemarks?: string;
  status: 'Draft' | 'Upcoming' | 'Registration Pending' | 'Active' | 'Full' | 'Completed' | 'Cancelled';
  bloodCenterId?: mongoose.Types.ObjectId;
  timeslots?: {
    startTime: string;
    endTime: string;
    capacity: number;
    registeredCount: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  campaignCode: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  description: { type: String, required: true },
  venue: { type: String, required: true },
  fullAddress: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [106.660172, 10.762622] } // Default coordinates (HCM City)
  },
  startDateTime: { type: Date, required: true, index: true },
  endDateTime: { type: Date, required: true },
  targetBloodGroups: { type: [String], required: true },
  capacity: { type: Number, required: true, min: 1 },
  registeredCount: { type: Number, default: 0, min: 0 },
  targetUnitsGoal: { type: Number, required: true, min: 1 },
  contactPerson: {
    name: { type: String, required: true },
    phone: { type: String, required: true }
  },
  internalRemarks: { type: String },
  status: {
    type: String,
    enum: ['Draft', 'Upcoming', 'Registration Pending', 'Active', 'Full', 'Completed', 'Cancelled'],
    default: 'Upcoming',
    index: true
  },
  bloodCenterId: { type: Schema.Types.ObjectId, ref: 'BloodCenter' },
  timeslots: [{
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    capacity: { type: Number, required: true },
    registeredCount: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

CampaignSchema.index({ location: '2dsphere' });
CampaignSchema.index({ venue: 'text', fullAddress: 'text', name: 'text' });

if (mongoose.models.Campaign) {
  delete (mongoose.models as any).Campaign;
}

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
