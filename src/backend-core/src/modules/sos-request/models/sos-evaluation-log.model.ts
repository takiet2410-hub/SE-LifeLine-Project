import { Schema, model, Document, Types } from 'mongoose';

export interface ISOSEvaluationLog extends Document {
  sosRequestId: Types.ObjectId;
  rankedBloodCenters: Array<{
    centerId: Types.ObjectId;
    score: number;
    inventoryVolume: number;
    distanceKm: number;
  }>;
  rankedDonors: Array<{
    donorId: Types.ObjectId;
    score: number;
    distanceKm: number;
    lastDonationDate?: Date;
    engagementTier: number;
  }>;
  searchRadiusKmUsed: number;
  radiusExpansionCount: number;
  notificationDeliveryStats: Record<string, any>;
  evaluatedAt: Date;
  immutable: boolean;
}

const sosEvaluationLogSchema = new Schema<ISOSEvaluationLog>({
  sosRequestId: { type: Schema.Types.ObjectId, ref: 'SOSRequest', required: true, index: true },
  rankedBloodCenters: [{
    centerId: { type: Schema.Types.ObjectId, ref: 'BloodCenter' },
    score: { type: Number },
    inventoryVolume: { type: Number },
    distanceKm: { type: Number }
  }],
  rankedDonors: [{
    donorId: { type: Schema.Types.ObjectId, ref: 'DonorProfile' },
    score: { type: Number },
    distanceKm: { type: Number },
    lastDonationDate: { type: Date },
    engagementTier: { type: Number }
  }],
  searchRadiusKmUsed: { type: Number, default: 10 },
  radiusExpansionCount: { type: Number, default: 0 },
  notificationDeliveryStats: { type: Schema.Types.Mixed, default: {} },
  evaluatedAt: { type: Date, default: Date.now },
  immutable: { type: Boolean, default: true }
}, {
  timestamps: false, // Using evaluatedAt as the primary timestamp
  collection: 'sos_evaluation_logs'
});

export const SOSEvaluationLog = model<ISOSEvaluationLog>('SOSEvaluationLog', sosEvaluationLogSchema);
