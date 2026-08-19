import { Schema, model, Document, Types } from 'mongoose';

export interface IBadge extends Document {
  donorId: Types.ObjectId;
  badgeType: string;
  title: string;
  description: string;
  icon: string;
  awardedAt: Date;
}

const badgeSchema = new Schema<IBadge>({
  donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  badgeType: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '🏆' },
  awardedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'badges'
});

badgeSchema.index({ donorId: 1, badgeType: 1 }, { unique: true });

export const Badge = model<IBadge>('Badge', badgeSchema);
