import mongoose, { Schema, Model } from 'mongoose';

export interface ITimeAdjustment {
  _id: string;
  userId: mongoose.Types.ObjectId;
  adjustmentType: 'early-out' | 'half-day' | 'late-in' | 'other';
  originalTime?: Date;
  adjustedTime: Date;
  date: Date;
  reason: string;
  approvedBy: mongoose.Types.ObjectId;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const TimeAdjustmentSchema = new Schema<ITimeAdjustment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adjustmentType: {
      type: String,
      enum: ['early-out', 'half-day', 'late-in', 'other'],
      required: true,
    },
    originalTime: {
      type: Date,
    },
    adjustedTime: {
      type: Date,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved', // Usually approved immediately by admin doing manual adjustment
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
TimeAdjustmentSchema.index({ userId: 1, date: -1 });
TimeAdjustmentSchema.index({ approvedBy: 1 });
TimeAdjustmentSchema.index({ status: 1 });

const TimeAdjustment: Model<ITimeAdjustment> =
  mongoose.models.TimeAdjustment || mongoose.model<ITimeAdjustment>('TimeAdjustment', TimeAdjustmentSchema);

export default TimeAdjustment;
