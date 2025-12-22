import logger from '@/lib/logger';
import { startOfDay, endOfDay } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/server/services/attendanceService';

export async function getAttendances(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const queryUserId = searchParams.get('userId');

    // Admin can view any attendance. If requester is not admin/super-admin,
    // they may only request their own attendance (or omit to get their own).
    if (queryUserId && (user.role !== 'admin' && user.role !== 'super-admin') && queryUserId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If admin and no userId provided, we'll fetch for all users (service handles undefined userId)
    const userId = queryUserId || (user.role === 'admin' || user.role === 'super-admin' ? undefined : user.userId);

    // Normalize dates to full-day range if provided
    let s = startDate;
    let e = endDate;
    if (startDate && endDate) {
      s = startOfDay(new Date(startDate)).toISOString();
      e = endOfDay(new Date(endDate)).toISOString();
    }
    const attendances = await service.findAttendances({ userId, startDate: s, endDate: e });
    return NextResponse.json({ success: true, attendances });
  } catch (err: any) {
    logger.error('getAttendances error', { message: err.message, stack: err.stack, route: '/api/attendance', user: user?.userId });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
