import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: string;
  action: string;
  targetId?: string;
  targetType: string;
  details?: Record<string, any>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    targetId: { type: String, required: false, index: true },
    targetType: { type: String, required: true, index: true },
    details: { type: Schema.Types.Mixed, required: false },
    timestamp: { type: Date, default: Date.now, required: true },
  },
  { 
    timestamps: false,
    versionKey: false 
  }
);

// Enforce collection immutability: prevent all update/delete operations
auditLogSchema.pre('updateOne', function(next) {
  next(new Error('Audit logs are immutable and cannot be updated'));
});
auditLogSchema.pre('updateMany', function(next) {
  next(new Error('Audit logs are immutable and cannot be updated'));
});
auditLogSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('Audit logs are immutable and cannot be updated'));
});
auditLogSchema.pre('deleteOne', function(next) {
  next(new Error('Audit logs are immutable and cannot be deleted'));
});
auditLogSchema.pre('deleteMany', function(next) {
  next(new Error('Audit logs are immutable and cannot be deleted'));
});
auditLogSchema.pre('findOneAndDelete', function(next) {
  next(new Error('Audit logs are immutable and cannot be deleted'));
});

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
