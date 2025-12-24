import { NextResponse } from 'next/server';
import * as notificationService from '@/server/services/notificationService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipientId, title, description, link } = body;
    if (!recipientId || !title) return NextResponse.json({ error: 'recipientId and title are required' }, { status: 400 });

    const notif = await notificationService.createNotification({ recipientId, title, description, link, category: 'DEBUG' });
    return NextResponse.json({ success: true, notification: notif });
  } catch (err: any) {
    console.error('debug create-notification error', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
