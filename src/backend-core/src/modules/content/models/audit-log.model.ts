import mongoose, { Document, Schema } from 'mongoose';

export interface IContentAuditLog extends Document {
  actorUserId: mongoose.Types.ObjectId;
  action: 'CREATE_ARTICLE' | 'UPDATE_ARTICLE' | 'DELETE_ARTICLE' | 'PUBLISH_ARTICLE';
  resourceType: 'Article';
  resourceId: mongoose.Types.ObjectId;
  previousValue?: any;
  newValue?: any;
  timestamp: Date;
  ipAddress?: string;
}

const ContentAuditLogSchema: Schema = new Schema({
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  resourceType: { type: String, default: 'Article', required: true },
  resourceId: { type: Schema.Types.ObjectId, required: true },
  previousValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String, default: '127.0.0.1' }
}, {
  timestamps: true,
  collection: 'content_audit_logs'
});

export const ContentAuditLog = mongoose.model<IContentAuditLog>('ContentAuditLog', ContentAuditLogSchema);
