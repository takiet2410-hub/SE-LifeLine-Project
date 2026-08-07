import mongoose, { Document, Schema } from 'mongoose';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type BagStatus = 'Available' | 'Reserved' | 'Used' | 'Expired' | 'Discarded';

export interface IStatusHistory {
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}


export interface IBloodBag extends Document {
  bagCode: string;
  bloodCenterId?: mongoose.Types.ObjectId;
  bloodType: BloodType;
  volumeMl: number;
  collectionDate: Date;
  expiryDate: Date;
  storageLocation: string;
  shelfPosition?: string;
  temperatureCelsius?: number;
  status: BagStatus;
  donorSourceId?: mongoose.Types.ObjectId;
  campaignSourceId?: mongoose.Types.ObjectId;
  testResult: 'Pass' | 'Rejected' | 'Pending';
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const statusHistorySchema = new Schema<IStatusHistory>({
  previousStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  changedBy: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  reason: { type: String }
}, { _id: false });


export const bloodBagSchema = new Schema<IBloodBag>({
  bagCode: { type: String, required: true, unique: true, index: true },
  bloodCenterId: { type: Schema.Types.ObjectId, ref: 'BloodCenter' },
  bloodType: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 
    required: true, 
    index: true 
  },
  volumeMl: { type: Number, required: true, min: 1 },
  collectionDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true, index: true },
  storageLocation: { type: String, required: true },
  shelfPosition: { type: String },
  temperatureCelsius: { type: Number, default: 4 },
  status: { 
    type: String, 
    enum: ['Available', 'Reserved', 'Used', 'Expired', 'Discarded'], 
    default: 'Available', 
    index: true 
  },
  donorSourceId: { type: Schema.Types.ObjectId, ref: 'User' },
  campaignSourceId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
  testResult: { type: String, enum: ['Pass', 'Rejected', 'Pending'], default: 'Pending' },
  statusHistory: [statusHistorySchema]
}, {
  timestamps: true,
  collection: 'blood_bags'
});

bloodBagSchema.index({ expiryDate: 1, status: 1 });
bloodBagSchema.index({ bloodType: 1, status: 1 });

export const BloodBag = mongoose.model<IBloodBag>('BloodBag', bloodBagSchema);
