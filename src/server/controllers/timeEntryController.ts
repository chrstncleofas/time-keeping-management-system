import User from '@/lib/models/User';
import logger from '@/lib/logger';
import { formatDateTime } from '@/lib/utils/helpers';
import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/server/services/timeEntryService';
import * as notificationService from '@/server/services/notificationService';
import { createAuditLog, getClientIP, getUserAgent, AUDIT_ACTIONS } from '@/lib/utils/auditLog';

export async function createEntry(request: NextRequest, user: any) {
  try {
    const { type, photoBase64, location } = await request.json();
    if (!type || !photoBase64) return NextResponse.json({ error: 'Type and photo are required' }, { status: 400 });

    const result = await service.createTimeEntry({ userId: user.userId, type, photoBase64, location });

    // Audit log
    const action = type === 'time-in' ? AUDIT_ACTIONS.TIME_IN : AUDIT_ACTIONS.TIME_OUT;
    await createAuditLog({ userId: user.userId, userName: `${result.userDetails.firstName} ${result.userDetails.lastName}`, userRole: result.userDetails.role, action, category: 'ATTENDANCE', description: `${type === 'time-in' ? 'Clocked in' : 'Clocked out'}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { timeEntryId: result.timeEntry._id, attendanceId: result.attendance._id }, status: 'SUCCESS' });

    // Create notifications for admins and super-admins
    try {
      const admins = await User.find({ role: { $in: ['admin', 'super-admin'] }, isActive: true });
      const adminIds = admins.map(a => a._id.toString());
      const employeeName = `${result.userDetails.firstName} ${result.userDetails.lastName}`;
      const title = `${employeeName} ${type === 'time-in' ? 'clocked in' : 'clocked out'}`;
      const description = `${employeeName} has ${type === 'time-in' ? 'clocked in' : 'clocked out'} at ${formatDateTime(new Date())}`;
      await notificationService.createNotificationForUsers(adminIds, { actorId: user.userId, title, description, category: 'ATTENDANCE', metadata: { timeEntryId: result.timeEntry._id, attendanceId: result.attendance._id } });
    } catch (err) {
      // swallow notification errors
      console.error('notify admins time entry error', err);
    }

    return NextResponse.json({ success: true, timeEntry: result.timeEntry, attendance: result.attendance }, { status: 201 });
  } catch (err: any) {
    logger.error('createEntry error', { message: err.message, stack: err.stack, route: '/api/time-entries' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function getEntries(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId') || user.userId;

    if ((user.role !== 'admin' && user.role !== 'super-admin') && userId !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const timeEntries = await service.findTimeEntries({ userId, startDate, endDate });
    return NextResponse.json({ success: true, timeEntries });
  } catch (err: any) {
    logger.error('getEntries error', { message: err.message, stack: err.stack, route: '/api/time-entries' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function updateEntry(request: NextRequest, user: any) {
  try {
    if (user.role !== 'admin' && user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, status } = await request.json();
    if (!id || !status || !['approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const updated = await service.updateTimeEntryStatus(id, status as 'approved' | 'rejected');

    // Audit log for admin action
    await createAuditLog({ userId: user.userId, userName: user.name || user.email || user.userId, userRole: user.role, action: status === 'approved' ? AUDIT_ACTIONS.TIME_IN : AUDIT_ACTIONS.TIME_OUT, category: 'ATTENDANCE', description: `Time entry ${id} marked ${status} by admin`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { timeEntryId: id }, status: 'SUCCESS' });

    return NextResponse.json({ success: true, timeEntry: updated });
  } catch (err: any) {
    logger.error('updateEntry error', { message: err.message, stack: err.stack, route: '/api/time-entries' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
