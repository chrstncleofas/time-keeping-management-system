import { 
  base64ToBuffer,
  getCurrentDayOfWeek,
  isLate,
  isEarlyOut,
  calculateLatenessMinutes,
  calculateEarlyOutMinutes,
  calculateDetailedHours,
  getPhilippineTime 
} from '@/lib/utils/helpers';

import connectDB from '@/lib/db/mongodb';
import TimeEntry from '@/lib/models/TimeEntry';
import Attendance from '@/lib/models/Attendance';
import Schedule from '@/lib/models/Schedule';
import User from '@/lib/models/User';
import { startOfDay, endOfDay } from 'date-fns';
import { uploadToS3, isS3Configured } from '@/lib/utils/s3';

export async function createTimeEntry({ userId, type, photoBase64, location }: { userId: string; type: string; photoBase64: string; location?: any }) {
  await connectDB();

  const userDetails = await User.findById(userId);
  if (!userDetails) throw new Error('User not found');

  const today = getPhilippineTime();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  const currentDay = getCurrentDayOfWeek();
  // Pick the most recently updated active schedule for the current day to
  // avoid using an older active schedule when admins edit schedules.
  const schedule = await Schedule.findOne({ userId, days: currentDay, isActive: true }).sort({ updatedAt: -1 });
  if (!schedule) throw new Error(`No schedule found for ${currentDay}`);

  const existingEntry = await TimeEntry.findOne({ userId, type, timestamp: { $gte: startOfToday, $lte: endOfToday } });
  if (existingEntry) throw new Error('Already has entry for today');

  if (!isS3Configured()) throw new Error('Cloud storage not configured');

  const buffer = base64ToBuffer(photoBase64);
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${userDetails.employeeId || userId}-${dateStr}.jpg`;
  const s3Key = `attendance-photos/${filename}`;

  const uploadResult = await uploadToS3({ buffer, key: s3Key, contentType: 'image/jpeg', metadata: { userId, employeeId: userDetails.employeeId || '', lastName: userDetails.lastName, type, uploadedAt: new Date().toISOString() } });
  if (!uploadResult.success) throw new Error('Failed to upload photo');

  const photoUrl = uploadResult.url!;

  const timeEntry = await TimeEntry.create({ userId, type, timestamp: getPhilippineTime(), photoUrl, location, status: 'approved' });

  let attendance = await Attendance.findOne({ userId, date: { $gte: startOfToday, $lte: endOfToday } });
  if (!attendance) {
    attendance = await Attendance.create({ userId, date: startOfToday, status: 'present' });
  }

  if (type === 'time-in') {
    attendance.timeIn = timeEntry.toObject();
    attendance.status = 'present';
    attendance.isLate = isLate(timeEntry.timestamp, schedule.timeIn);
    attendance.lateMinutes = calculateLatenessMinutes(timeEntry.timestamp, schedule.timeIn);
  } else if (type === 'time-out') {
    attendance.timeOut = timeEntry.toObject();
    if (attendance.timeIn) {
      const hoursBreakdown = calculateDetailedHours(
        attendance.timeIn.timestamp,
        timeEntry.timestamp,
        schedule.lunchStart,
        schedule.lunchEnd,
        schedule.timeIn,
        schedule.timeOut
      );
      attendance.totalHours = hoursBreakdown.totalHours;
      attendance.lunchBreakMinutes = hoursBreakdown.lunchBreakMinutes;
      attendance.workedHours = hoursBreakdown.workedHours;
      attendance.overtimeMinutes = (hoursBreakdown as any).overtimeMinutes || 0;
      attendance.overtimeHours = (hoursBreakdown as any).overtimeHours || 0;
    }
    attendance.isEarlyOut = isEarlyOut(timeEntry.timestamp, schedule.timeOut);
    attendance.earlyOutMinutes = calculateEarlyOutMinutes(timeEntry.timestamp, schedule.timeOut);
  }

  await attendance.save();

  return { timeEntry, attendance, userDetails, schedule };
}

export async function findTimeEntries({ userId, startDate, endDate }: { userId: string; startDate?: string | null; endDate?: string | null }) {
  await connectDB();
  const query: any = { userId };
  if (startDate && endDate) {
    query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  const timeEntries = await TimeEntry.find(query).sort({ timestamp: -1 }).limit(100);
  return timeEntries;
}

export async function updateTimeEntryStatus(id: string, status: 'approved' | 'rejected') {
  await connectDB();

  const entry = await TimeEntry.findById(id);
  if (!entry) throw new Error('Time entry not found');

  entry.status = status;
  await entry.save();

  // Also update any Attendance document that has this time entry embedded
  // Attendance stores timeIn/timeOut as plain objects, so find and update
  const AttendanceModel = (await import('@/lib/models/Attendance')).default;
  const attendance = await AttendanceModel.findOne({
    $or: [{ 'timeIn._id': id }, { 'timeOut._id': id }],
  });

  if (attendance) {
    if (attendance.timeIn && (attendance.timeIn as any)._id?.toString() === id.toString()) {
      (attendance.timeIn as any).status = status;
    }
    if (attendance.timeOut && (attendance.timeOut as any)._id?.toString() === id.toString()) {
      (attendance.timeOut as any).status = status;
    }
    await attendance.save();
  }

  return entry;
}
