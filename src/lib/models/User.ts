import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '@/types';
import bcrypt from 'bcryptjs';

interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'employee', 'super-admin'],
      default: 'employee',
      required: true,
    },
    employeeId: {
      type: String,
      sparse: true,
      trim: true,
      index: { unique: true, sparse: true },
    },
    birthday: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    age: {
      type: Number,
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    sss: {
      type: String,
      trim: true,
    },
    philhealth: {
      type: String,
      trim: true,
    },
    pagibig: {
      type: String,
      trim: true,
    },
    tin: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
    },
    leaveCredits: {
      type: Number,
      default: 5,
      min: 0,
      max: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete (ret as any).password;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for faster queries
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

const User: UserModel =
  mongoose.models.User || mongoose.model<IUser, UserModel>('User', UserSchema);

export default User;
