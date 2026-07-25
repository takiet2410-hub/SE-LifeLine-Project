import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actorUserId: mongoose.Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId: mongoose.Types.ObjectId;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

const AuditLogSchema: Schema = new Schema({
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, index: true },
  resourceType: { type: String, required: true },
  resourceId: { type: Schema.Types.ObjectId, required: true, index: true },
  previousValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: { type: String }
}, {
  timestamps: false,
  collection: 'audit_logs'
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
