import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/utils/email';
import { formatDateTime } from '@/lib/utils/helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const to = body.to || process.env.EMAIL_USER || process.env.SMTP_USER;
    if (!to) return NextResponse.json({ success: false, error: 'No recipient provided' }, { status: 400 });

    const subject = 'TKMS Test Email';
    const html = `<p>This is a test email from TKMS at ${formatDateTime(new Date())}.</p>`;

    const result = await sendEmail({ to, subject, html });
    if (!result.success) return NextResponse.json(result, { status: 500 });
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 });
  }
}
