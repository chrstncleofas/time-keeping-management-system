import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/server/services/notificationService';
import { authMiddleware } from '@/lib/middleware/auth';
import logger from '@/lib/logger';

export async function getNotifications(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifications = await service.findNotificationsForUser(auth.user._id.toString(), 100);
    return NextResponse.json({ success: true, notifications });
  } catch (err: any) {
    logger.error('getNotifications error', { message: err.message, stack: err.stack, route: '/api/notifications' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function markAllRead(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await service.markAllAsReadForUser(auth.user._id.toString());
    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error('markAllRead error', { message: err.message, stack: err.stack, route: '/api/notifications' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
