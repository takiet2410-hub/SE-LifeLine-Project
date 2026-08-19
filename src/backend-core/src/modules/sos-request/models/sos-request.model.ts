import { Schema, model, Document, Types } from 'mongoose';

export interface ISOSShipment {
  _id?: Types.ObjectId;
  shipmentCode: string;
  bloodCenterId?: Types.ObjectId;
  bloodCenterName?: string;
  dispatchedByStaffId: Types.ObjectId;
  dispatchedStaffName?: string;
  bloodBagIds: Types.ObjectId[];
  volumeMl: number;
  bloodType: string;
  dispatchedAt: Date;
  status: 'InTransit' | 'Received' | 'Cancelled';
  receivedAt?: Date;
  receivedByStaffId?: Types.ObjectId;
}

export interface IDirectDonation {
  _id?: Types.ObjectId;
  donorId?: Types.ObjectId;
  donorName: string;
  idDocumentNumber?: string;
  donorPhone?: string;
  bloodType?: string;
  fastTrackCode?: string;
  volumeMl: number;
  recordedAt: Date;
  recordedByStaffId: Types.ObjectId;
  note?: string;
}

export interface ISOSRequest extends Document {
  hospitalId: Types.ObjectId;
  createdByStaffId: Types.ObjectId;
  bloodType: string;
  requiredQuantityMl: number;
  urgencyLevel: 'Critical' | 'High' | 'Medium';
  patientReference?: string;
  fulfillmentDeadline: Date;
  status: 'Pending' | 'EvaluationInProgress' | 'NotificationsDispatched' | 'InventoryDispatched' | 'Fulfilled' | 'Expired' | 'Cancelled' | 'EvaluationFailed';
  pledgedQuantityMl: number;
  collectedQuantityMl: number;
  receivedQuantityMl: number;
  inTransitQuantityMl: number;
  shipments: ISOSShipment[];
  directDonations: IDirectDonation[];
  acceptedDonorIds: Types.ObjectId[];
  fulfilledByStaffId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sosShipmentSchema = new Schema<ISOSShipment>({
  shipmentCode: { type: String, required: true },
  bloodCenterId: { type: Schema.Types.ObjectId, ref: 'BloodCenter' },
  bloodCenterName: { type: String },
  dispatchedByStaffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dispatchedStaffName: { type: String },
  bloodBagIds: [{ type: Schema.Types.ObjectId, ref: 'BloodBag' }],
  volumeMl: { type: Number, required: true },
  bloodType: { type: String, required: true },
  dispatchedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['InTransit', 'Received', 'Cancelled'], default: 'InTransit' },
  receivedAt: { type: Date },
  receivedByStaffId: { type: Schema.Types.ObjectId, ref: 'User' }
});

const directDonationSchema = new Schema<IDirectDonation>({
  donorId: { type: Schema.Types.ObjectId, ref: 'User' },
  donorName: { type: String, required: true },
  idDocumentNumber: { type: String },
  donorPhone: { type: String },
  bloodType: { type: String },
  fastTrackCode: { type: String },
  volumeMl: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now },
  recordedByStaffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String }
});

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
    enum: ['Pending', 'EvaluationInProgress', 'NotificationsDispatched', 'InventoryDispatched', 'Fulfilled', 'Expired', 'Cancelled', 'EvaluationFailed'],
    default: 'Pending',
    index: true
  },
  pledgedQuantityMl: { type: Number, default: 0, min: 0 },
  collectedQuantityMl: { type: Number, default: 0 },
  receivedQuantityMl: { type: Number, default: 0 },
  inTransitQuantityMl: { type: Number, default: 0 },
  shipments: [sosShipmentSchema],
  directDonations: [directDonationSchema],
  acceptedDonorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  fulfilledByStaffId: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'sos_requests'
});

export const SOSRequest = model<ISOSRequest>('SOSRequest', sosRequestSchema);
