import logger from '@/lib/logger';
import { authMiddleware } from '@/lib/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/server/services/absenceService';

export async function getAbsences(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const absences = await service.findAbsences({ user: auth.user, userId });
    return NextResponse.json({ success: true, absences });
  } catch (err: any) {
    logger.error('getAbsences error', { message: err.message, stack: err.stack, route: '/api/absence' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function createAbsence(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });
    if (auth.user.role !== 'admin' && auth.user.role !== 'super-admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const payload = await request.json();
    const absence = await service.createAbsence(payload, auth.user._id);
    return NextResponse.json({ success: true, absence }, { status: 201 });
  } catch (err: any) {
    logger.error('createAbsence error', { message: err.message, stack: err.stack, route: '/api/absence' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
