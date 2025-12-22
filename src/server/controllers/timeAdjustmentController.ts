import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/server/services/timeAdjustmentService';
import logger from '@/lib/logger';
import { authMiddleware } from '@/lib/middleware/auth';
import { createAuditLog, getClientIP, getUserAgent, AUDIT_ACTIONS } from '@/lib/utils/auditLog';
import User from '@/lib/models/User';

export async function getAdjustments(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });
    if (auth.user.role !== 'admin' && auth.user.role !== 'super-admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const adjustments = await service.findAdjustments();
    return NextResponse.json({ success: true, adjustments });
  } catch (err: any) {
    logger.error('getAdjustments error', { message: err.message, stack: err.stack, route: '/api/time-adjustments' });
    return NextResponse.json({ error: 'Failed to fetch time adjustments' }, { status: 500 });
  }
}

export async function createAdjustment(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });
    if (auth.user.role !== 'admin' && auth.user.role !== 'super-admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const populated = await service.createAdjustment(await request.json(), auth.user._id);

    // audit log (be defensive about populated / populated.userId)
    const populatedAny: any = populated as any;
    const employeeName = populatedAny && populatedAny.userId && populatedAny.userId.firstName && populatedAny.userId.lastName
      ? `${populatedAny.userId.firstName} ${populatedAny.userId.lastName}`
      : 'Unknown';
    const adminUser = await User.findById(auth.user._id);
    const adminName = adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : 'Unknown';
    await createAuditLog({ userId: auth.user._id, userName: adminName, userRole: auth.user.role, action: AUDIT_ACTIONS.USER_UPDATED, category: 'ATTENDANCE', description: `Manual time adjustment created for ${employeeName}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { adjustmentId: populatedAny?._id }, status: 'SUCCESS' });

    return NextResponse.json({ success: true, adjustment: populated });
  } catch (err: any) {
    logger.error('createAdjustment error', { message: err.message, stack: err.stack, route: '/api/time-adjustments' });
    return NextResponse.json({ error: 'Failed to create time adjustment' }, { status: 500 });
  }
}
