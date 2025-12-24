import mongoose, { Schema, Model } from 'mongoose';
import { IAttendance } from '@/types';

type AttendanceModel = Model<IAttendance>;

const AttendanceSchema = new Schema<IAttendance, AttendanceModel>(
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
    timeIn: {
      type: Schema.Types.Mixed,
      ref: 'TimeEntry',
    },
    timeOut: {
      type: Schema.Types.Mixed,
      ref: 'TimeEntry',
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    lunchBreakMinutes: {
      type: Number,
      default: 0,
    },
    workedHours: {
      type: Number,
      default: 0,
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    isEarlyOut: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'on-leave', 'holiday'],
      default: 'absent',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for unique attendance per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ status: 1, date: -1 });

const Attendance: AttendanceModel =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance, AttendanceModel>('Attendance', AttendanceSchema);

export default Attendance;
