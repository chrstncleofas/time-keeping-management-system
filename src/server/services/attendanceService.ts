import connectDB from '@/lib/db/mongodb';
import Attendance from '@/lib/models/Attendance';

export async function findAttendances({ 
  userId, startDate, endDate
}: { 
  userId?: string | undefined; startDate?: string | null; endDate?: string | null; 
}) {

  await connectDB();

  const query: any = {};
  if (userId) query.userId = userId;

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const attendances = await Attendance.find(query)
    .sort({ date: -1 })
    .limit(100)
    .populate('userId', 'firstName lastName employeeId');

  return attendances;
}
