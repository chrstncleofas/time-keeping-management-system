import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/server/services/leaveService';
import logger from '@/lib/logger';
import { authMiddleware } from '@/lib/middleware/auth';
import { createAuditLog, getClientIP, getUserAgent, AUDIT_ACTIONS } from '@/lib/utils/auditLog';

export async function getLeaves(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });

    const leaves = await service.findLeavesForUser(auth.user);
    return NextResponse.json({ success: true, leaves });
  } catch (err: any) {
    logger.error('getLeaves error', { message: err.message, stack: err.stack, route: '/api/leave' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function createLeave(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });

    const result = await service.createLeaveRequest(auth.user, await request.json());

    await createAuditLog({ userId: auth.user._id, userName: `${result.dbUser.firstName} ${result.dbUser.lastName}`, userRole: auth.user.role, action: AUDIT_ACTIONS.LEAVE_REQUEST_CREATED, category: 'LEAVE', description: `Created ${result.leave.leaveType} leave request`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { leaveId: result.leave._id, days: result.daysDiff }, status: 'SUCCESS' });

    return NextResponse.json({ success: true, leave: result.leave }, { status: 201 });
  } catch (err: any) {
    logger.error('createLeave error', { message: err.message, stack: err.stack, route: '/api/leave' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function updateLeaveById(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });
    if (auth.user.role !== 'admin' && auth.user.role !== 'super-admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { status, adminNotes } = body;
    if (!['approved','rejected'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const leave = await (require as any)('@/lib/models/Leave').default.findById(params.id);
    if (!leave) return NextResponse.json({ error: 'Leave not found' }, { status: 404 });

    leave.status = status; if (adminNotes) leave.adminNotes = adminNotes;
    await leave.save();

    const employee = await (require as any)('@/lib/models/User').default.findById(leave.userId);
    const admin = await (require as any)('@/lib/models/User').default.findById(auth.user._id);
    const adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'Admin';

    if (employee) {
      const employeeName = `${employee.firstName} ${employee.lastName}`;
      const startDateStr = (require as any)('date-fns').format(new Date(leave.startDate), 'MMM dd, yyyy');
      const endDateStr = (require as any)('date-fns').format(new Date(leave.endDate), 'MMM dd, yyyy');
      const leaveTypeStr = leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1);
      await createAuditLog({ userId: auth.user._id, userName: adminName, userRole: auth.user.role, action: status === 'approved' ? AUDIT_ACTIONS.LEAVE_REQUEST_APPROVED : AUDIT_ACTIONS.LEAVE_REQUEST_REJECTED, category: 'LEAVE', description: `${status === 'approved' ? 'Approved' : 'Rejected'} leave request for ${employeeName} (${leaveTypeStr}) from ${startDateStr} to ${endDateStr}${adminNotes ? ` - Note: ${adminNotes}` : ''}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { leaveId: leave._id, employeeId: leave.userId, employeeName, leaveType: leave.leaveType, startDate: leave.startDate, endDate: leave.endDate, adminNotes }, status: 'SUCCESS' });
      try {
        if (status === 'approved') {
          await (require as any)('@/lib/utils/email').sendEmail({ to: employee.email, subject: 'Leave Request Approved', html: (require as any)('@/lib/utils/email').emailTemplates.leaveApproved(employeeName, leaveTypeStr, startDateStr, endDateStr) });
        } else {
          await (require as any)('@/lib/utils/email').sendEmail({ to: employee.email, subject: 'Leave Request Status Update', html: (require as any)('@/lib/utils/email').emailTemplates.leaveRejected(employeeName, leaveTypeStr, startDateStr, endDateStr, adminNotes) });
        }
      } catch (e) {
        // swallow email errors
      }
    }

    if (status === 'approved') {
      const start = new Date(leave.startDate); const end = new Date(leave.endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1;
      await (require as any)('@/lib/models/User').default.findByIdAndUpdate(leave.userId, { $inc: { leaveCredits: -daysDiff } });
    }

    return NextResponse.json({ success: true, leave });
  } catch (err: any) {
    logger.error('updateLeaveById error', { message: err.message, stack: err.stack, route: '/api/leave/[id]' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function deleteLeaveById(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });

    const leave = await (require as any)('@/lib/models/Leave').default.findById(params.id);
    if (!leave) return NextResponse.json({ error: 'Leave not found' }, { status: 404 });

    if ((auth.user.role !== 'admin' && auth.user.role !== 'super-admin') && leave.userId !== auth.user._id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    if (leave.status !== 'pending') return NextResponse.json({ error: 'Can only delete pending leave requests' }, { status: 400 });

    const user = await (require as any)('@/lib/models/User').default.findById(auth.user._id);
    const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
    const employee = await (require as any)('@/lib/models/User').default.findById(leave.userId);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Employee';

    await (require as any)('@/lib/models/Leave').default.findByIdAndDelete(params.id);

    await createAuditLog({ userId: auth.user._id, userName, userRole: auth.user.role, action: AUDIT_ACTIONS.LEAVE_REQUEST_CANCELLED, category: 'LEAVE', description: `${auth.user._id === leave.userId ? 'Cancelled own' : 'Deleted'} leave request for ${employeeName} (${leave.leaveType})`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { leaveId: params.id, employeeId: leave.userId, leaveType: leave.leaveType, startDate: leave.startDate, endDate: leave.endDate }, status: 'SUCCESS' });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error('deleteLeaveById error', { message: err.message, stack: err.stack, route: '/api/leave/[id]' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
