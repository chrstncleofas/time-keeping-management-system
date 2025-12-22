import logger from '@/lib/logger';
import User from '@/lib/models/User';
import { authMiddleware } from '@/lib/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/server/services/scheduleService';
import { createAuditLog, getClientIP, getUserAgent, AUDIT_ACTIONS } from '@/lib/utils/auditLog';
import * as notificationService from '@/server/services/notificationService';

export async function getSchedules(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.userId;
    const queryUserId = searchParams.get('userId');
    // If requester is not admin/super-admin, ensure they only request their own schedules
    if ((user.role !== 'admin' && user.role !== 'super-admin') && (queryUserId && queryUserId !== user.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let schedules;
    // Admins/super-admins without a specific userId want to see all schedules
    if ((user.role === 'admin' || user.role === 'super-admin') && !queryUserId) {
      schedules = await service.findSchedules();
    } else {
      // fallback to requested userId or the authenticated user's id
      const targetUserId = queryUserId || user.userId;
      schedules = await service.findSchedules({ userId: targetUserId });
    }
    return NextResponse.json({ success: true, schedules });
  } catch (err: any) {
    logger.error('getSchedules error', { message: err.message, stack: err.stack, route: '/api/schedules' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function createSchedule(request: NextRequest, user: any) {
  try {
    const { userId, days, timeIn, timeOut } = await request.json();
    if (!userId || !days || !timeIn || !timeOut) return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    const schedule = await service.createSchedule({ userId, days, timeIn, timeOut });
    if (!schedule) {
      logger.error('createSchedule failed: schedule is null', { route: '/api/schedules' });
      return NextResponse.json({ error: 'Schedule creation failed' }, { status: 500 });
    }
    const admin = await User.findById(user.userId);
    const targetUser = await User.findById(userId);
    await createAuditLog({ userId: user.userId, userName: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin', userRole: user.role, action: AUDIT_ACTIONS.SCHEDULE_CREATED, category: 'SCHEDULE', description: `Created schedule for ${targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'User'}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { scheduleId: schedule._id, targetUserId: userId, days, timeIn, timeOut }, status: 'SUCCESS' });
    // notify the target user about the created schedule
    try {
      if (targetUser) {
        await notificationService.createNotification({ recipientId: targetUser._id.toString(), actorId: user.userId, title: `Your schedule was created`, description: `A schedule was created for you: ${timeIn} - ${timeOut}` , category: 'SCHEDULE', metadata: { scheduleId: schedule._id } });
      }
    } catch (err) {
      console.error('notify schedule create error', err);
    }
    return NextResponse.json({ success: true, schedule }, { status: 201 });
  } catch (err: any) {
    logger.error('createSchedule error', { message: err.message, stack: err.stack, route: '/api/schedules' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function updateSchedule(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');
    if (!scheduleId) return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    const updates = await request.json();
    const schedule = await service.updateSchedule(scheduleId, updates);
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    const admin = await User.findById(user.userId);
    const targetUser = await User.findById(schedule.userId);
    await createAuditLog({ userId: user.userId, userName: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin', userRole: user.role, action: AUDIT_ACTIONS.SCHEDULE_UPDATED, category: 'SCHEDULE', description: `Updated schedule for ${targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'User'}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { scheduleId, updates }, status: 'SUCCESS' });
    // notify the target user about the updated schedule
    try {
      if (targetUser) {
        await notificationService.createNotification({ recipientId: targetUser._id.toString(), actorId: user.userId, title: `Your schedule was updated`, description: `Your schedule was updated: ${JSON.stringify(updates)}` , category: 'SCHEDULE', metadata: { scheduleId } });
      }
    } catch (err) {
      console.error('notify schedule update error', err);
    }
    return NextResponse.json({ success: true, schedule });
  } catch (err: any) {
    logger.error('updateSchedule error', { message: err.message, stack: err.stack, route: '/api/schedules' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function deleteSchedule(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');
    if (!scheduleId) return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    const schedule = await service.deleteSchedule(scheduleId);
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    const admin = await User.findById(user.userId);
    const targetUser = await User.findById(schedule.userId);
    await createAuditLog({ userId: user.userId, userName: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin', userRole: user.role, action: AUDIT_ACTIONS.SCHEDULE_DELETED, category: 'SCHEDULE', description: `Deleted schedule for ${targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'User'}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { scheduleId, targetUserId: schedule.userId, deletedSchedule: { days: schedule.days, timeIn: schedule.timeIn, timeOut: schedule.timeOut } }, status: 'SUCCESS' });
    // notify the target user about the deleted schedule
    try {
      if (targetUser) {
        await notificationService.createNotification({ recipientId: targetUser._id.toString(), actorId: user.userId, title: `Your schedule was removed`, description: `Your schedule (${schedule.timeIn} - ${schedule.timeOut}) has been removed` , category: 'SCHEDULE', metadata: { scheduleId } });
      }
    } catch (err) {
      console.error('notify schedule delete error', err);
    }
    return NextResponse.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (err: any) {
    logger.error('deleteSchedule error', { message: err.message, stack: err.stack, route: '/api/schedules' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// Handlers for /api/schedule/[id]
export async function patchScheduleById(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });
    if (auth.user.role !== 'admin' && auth.user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    const updates = await request.json();
    const schedule = await service.updateSchedule(id, updates);
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    const admin = await User.findById(auth.user._id);
    const targetUser = await User.findById(schedule.userId);
    await createAuditLog({ userId: auth.user._id, userName: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin', userRole: auth.user.role, action: AUDIT_ACTIONS.SCHEDULE_UPDATED, category: 'SCHEDULE', description: `Updated schedule for ${targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'User'}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { scheduleId: id, updates }, status: 'SUCCESS' });
    return NextResponse.json({ success: true, schedule });
  } catch (err: any) {
    logger.error('patchScheduleById error', { message: err.message, stack: err.stack, route: '/api/schedule/[id]' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function deleteScheduleById(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });
    if (auth.user.role !== 'admin' && auth.user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    const schedule = await service.deleteSchedule(id);
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    const admin = await User.findById(auth.user._id);
    const targetUser = await User.findById(schedule.userId);
    await createAuditLog({ userId: auth.user._id, userName: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin', userRole: auth.user.role, action: AUDIT_ACTIONS.SCHEDULE_DELETED, category: 'SCHEDULE', description: `Deleted schedule for ${targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'User'}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { scheduleId: id, targetUserId: schedule.userId, deletedSchedule: { days: schedule.days, timeIn: schedule.timeIn, timeOut: schedule.timeOut } }, status: 'SUCCESS' });
    return NextResponse.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (err: any) {
    logger.error('deleteScheduleById error', { message: err.message, stack: err.stack, route: '/api/schedule/[id]' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
