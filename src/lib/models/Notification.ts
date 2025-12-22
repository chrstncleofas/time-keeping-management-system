import mongoose, { Schema, model } from 'mongoose';

export interface INotification extends mongoose.Document {
  recipient: mongoose.Types.ObjectId;
  actor?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  link?: string;
  category?: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actor: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String },
  link: { type: String },
  category: { type: String },
  read: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.Notification || model<INotification>('Notification', NotificationSchema);
