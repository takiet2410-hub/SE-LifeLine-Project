import { Schema, model, Document, Types } from 'mongoose';

export interface ISOSRequest extends Document {
  hospitalId: Types.ObjectId;
  createdByStaffId: Types.ObjectId;
  bloodType: string;
  requiredQuantityMl: number;
  urgencyLevel: 'Critical' | 'High' | 'Medium';
  patientReference?: string;
  fulfillmentDeadline: Date;
  status: 'Pending' | 'EvaluationInProgress' | 'NotificationsDispatched' | 'Fulfilled' | 'Expired' | 'Cancelled' | 'EvaluationFailed';
  createdAt: Date;
  updatedAt: Date;
}

const sosRequestSchema = new Schema<ISOSRequest>({
  hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  createdByStaffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bloodType: { type: String, required: true },
  requiredQuantityMl: { type: Number, required: true, min: 1 },
  urgencyLevel: { type: String, enum: ['Critical', 'High', 'Medium'], required: true },
  patientReference: { type: String },
  fulfillmentDeadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Pending', 'EvaluationInProgress', 'NotificationsDispatched', 'Fulfilled', 'Expired', 'Cancelled', 'EvaluationFailed'],
    default: 'Pending',
    index: true
  }
}, {
  timestamps: true,
  collection: 'sos_requests'
});

export const SOSRequest = model<ISOSRequest>('SOSRequest', sosRequestSchema);
