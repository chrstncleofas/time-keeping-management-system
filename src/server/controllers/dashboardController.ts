import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Attendance from '@/lib/models/Attendance';
import { startOfDay, endOfDay } from 'date-fns';
import { getPhilippineTime } from '@/lib/utils/helpers';

export const getStats = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();
    const today = getPhilippineTime();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });
    const todayAttendance = await Attendance.find({ date: { $gte: startOfToday, $lte: endOfToday } });
    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = totalEmployees - presentToday;
    const lateToday = todayAttendance.filter(a => a.isLate).length;
    const onLeaveToday = todayAttendance.filter(a => a.status === 'on-leave').length;
    return NextResponse.json({ success: true, stats: { totalEmployees, presentToday, absentToday, lateToday, onLeaveToday } });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
