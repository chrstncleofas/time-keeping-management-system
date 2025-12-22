import mongoose, { Schema, Model } from 'mongoose';
import { IAbsence } from '@/types';

const AbsenceSchema = new Schema<IAbsence>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: String,
      required: [true, 'Admin ID is required'],
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
AbsenceSchema.index({ userId: 1, date: -1 });
AbsenceSchema.index({ markedBy: 1 });

const Absence: Model<IAbsence> =
  mongoose.models.Absence || mongoose.model<IAbsence>('Absence', AbsenceSchema);

export default Absence;
