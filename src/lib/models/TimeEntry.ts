import mongoose, { Schema, Model } from 'mongoose';
import { ITimeEntry } from '@/types';

type TimeEntryModel = Model<ITimeEntry>;

const TimeEntrySchema = new Schema<ITimeEntry, TimeEntryModel>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['time-in', 'time-out'],
      required: [true, 'Type is required'],
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      default: Date.now,
    },
    photoUrl: {
      type: String,
      required: [true, 'Photo is required'],
    },
    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
TimeEntrySchema.index({ userId: 1, timestamp: -1 });
TimeEntrySchema.index({ type: 1, timestamp: -1 });
TimeEntrySchema.index({ status: 1 });

const TimeEntry: TimeEntryModel =
  mongoose.models.TimeEntry ||
  mongoose.model<ITimeEntry, TimeEntryModel>('TimeEntry', TimeEntrySchema);

export default TimeEntry;
