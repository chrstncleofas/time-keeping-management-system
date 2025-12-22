import connectDB from '@/lib/db/mongodb';
import Schedule from '@/lib/models/Schedule';
import User from '@/lib/models/User';

export async function findSchedules({ userId }: { userId?: string } = {}) {
  await connectDB();
  // Populate user basic info so UI can show names/employeeId
  if (userId) return Schedule.find({ userId, isActive: true }).populate('userId', 'firstName lastName employeeId');
  return Schedule.find({ isActive: true }).populate('userId', 'firstName lastName employeeId');
}

export async function createSchedule(payload: any) {
  await connectDB();
  const { userId } = payload;
  await Schedule.updateMany({ userId, isActive: true }, { isActive: false });
  const schedule = await Schedule.create({ ...payload, isActive: true });
  // Return populated schedule for immediate UI use
  return Schedule.findById(schedule._id).populate('userId', 'firstName lastName employeeId');
}

export async function updateSchedule(id: string, updates: any) {
  await connectDB();
  const updated = await Schedule.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!updated) return null;
  return Schedule.findById(updated._id).populate('userId', 'firstName lastName employeeId');
}

export async function deleteSchedule(id: string) {
  await connectDB();
  return Schedule.findByIdAndDelete(id);
}
