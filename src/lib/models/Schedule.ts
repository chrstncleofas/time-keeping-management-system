import mongoose, { Schema, Model } from 'mongoose';
import { ISchedule } from '@/types';

type ScheduleModel = Model<ISchedule>;

const ScheduleSchema = new Schema<ISchedule, ScheduleModel>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    days: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: [true, 'Days are required'],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one day must be selected',
      },
    },
    timeIn: {
      type: String,
      required: [true, 'Time in is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time in must be in HH:mm format'],
    },
    lunchStart: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Lunch start must be in HH:mm format'],
    },
    lunchEnd: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Lunch end must be in HH:mm format'],
    },
    timeOut: {
      type: String,
      required: [true, 'Time out is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time out must be in HH:mm format'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Validation: timeOut must be after timeIn
ScheduleSchema.pre('save', function (next) {
  const timeInMinutes = this.timeIn.split(':').reduce((acc, m) => acc * 60 + parseInt(m), 0);
  const timeOutMinutes = this.timeOut.split(':').reduce((acc, m) => acc * 60 + parseInt(m), 0);

  if (timeOutMinutes <= timeInMinutes) {
    next(new Error('Time out must be after time in'));
  } else {
    next();
  }
});

// Index for faster queries
ScheduleSchema.index({ userId: 1, isActive: 1 });
ScheduleSchema.index({ days: 1 });

const Schedule: ScheduleModel =
  mongoose.models.Schedule ||
  mongoose.model<ISchedule, ScheduleModel>('Schedule', ScheduleSchema);

export default Schedule;
