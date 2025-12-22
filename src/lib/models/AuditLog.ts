import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: 'admin' | 'employee' | 'super-admin';
  action: string; // e.g., 'LOGIN', 'TIME_IN', 'TIME_OUT', 'LEAVE_REQUEST', 'LEAVE_APPROVED', etc.
  category: 'AUTH' | 'ATTENDANCE' | 'LEAVE' | 'SCHEDULE' | 'USER' | 'SYSTEM';
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>; // Additional data (e.g., leave ID, attendance ID, etc.)
  status: 'SUCCESS' | 'FAILED';
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      enum: ['admin', 'employee', 'super-admin'],
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['AUTH', 'ATTENDANCE', 'LEAVE', 'SCHEDULE', 'USER', 'SYSTEM'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
