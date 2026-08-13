import { Schema, model, Document } from 'mongoose';

export interface IAdminAuditLog extends Document {
  timestamp: Date;
  actorUserId?: string;
  actorName: string;
  action: string;
  actionCategory: 'Authentication' | 'User Management' | 'Role Management' | 'System Configuration' | 'Feature Toggle' | 'Data Access' | 'SOS Request' | 'Content Management' | 'Registration';
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  status: 'Success' | 'Failure';
  previousValue?: any;
  newValue?: any;
  details?: string;
  createdAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    actorUserId: { type: String },
    actorName: { type: String, default: 'System' },
    action: { type: String, required: true },
    actionCategory: {
      type: String,
      enum: ['Authentication', 'User Management', 'Role Management', 'System Configuration', 'Feature Toggle', 'Data Access', 'SOS Request', 'Content Management', 'Registration'],
      required: true,
      index: true,
    },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    ipAddress: { type: String, default: '127.0.0.1' },
    status: { type: String, enum: ['Success', 'Failure'], default: 'Success', index: true },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    details: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  }
);

// Audit logs are append-only.
export const AdminAuditLog = model<IAdminAuditLog>('AdminAuditLog', adminAuditLogSchema);
