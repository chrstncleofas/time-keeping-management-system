import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const secure = (process.env.SMTP_SECURE === 'true') || (process.env.EMAIL_SECURE === 'true') || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Send email
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    if (!smtpUser || !smtpPass) {
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();

    const fromAddress = (process.env.EMAIL_FROM || smtpUser) as string;
    const displayName = process.env.NEXT_PUBLIC_APP_NAME || 'TKMS';

    const info = await transporter.sendMail({
      from: `"${displayName}" <${fromAddress}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
}

// Email templates
export const emailTemplates = {
  leaveRequest: (employeeName: string, leaveType: string, startDate: string, endDate: string, reason: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0066ff 0%, #003d99 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header .brand { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .brand-accent { color: #ff0000; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; border-left: 4px solid #0066ff; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .label { font-weight: bold; color: #0066ff; }
        .button { display: inline-block; background: #0066ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .button-reject { background: #ff0000; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">ibay<span class="brand-accent">tech</span></div>
          <h1>New Leave Request</h1>
        </div>
        <div class="content">
          <p>A new leave request has been submitted and requires your approval.</p>
          
          <div class="info-box">
            <p><span class="label">Employee:</span> ${employeeName}</p>
            <p><span class="label">Leave Type:</span> ${leaveType}</p>
            <p><span class="label">Start Date:</span> ${startDate}</p>
            <p><span class="label">End Date:</span> ${endDate}</p>
            <p><span class="label">Reason:</span> ${reason}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/admin/leaves" class="button">Review Request</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2025 IBAYTECH CORP. All rights reserved.</p>
          <p>Time Keeping Management System</p>
        </div>
      </div>
    </body>
    </html>
  `,

  leaveApproved: (employeeName: string, leaveType: string, startDate: string, endDate: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0066ff 0%, #003d99 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header .brand { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .brand-accent { color: #ff0000; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .info-box { background: white; border-left: 4px solid #0066ff; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .label { font-weight: bold; color: #0066ff; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">ibay<span class="brand-accent">tech</span></div>
          <h1>Leave Request Approved</h1>
        </div>
        <div class="content">
          <div class="success">
            <p style="margin: 0; font-weight: bold; color: #047857;">✓ Your leave request has been approved!</p>
          </div>
          
          <p>Hello ${employeeName},</p>
          <p>Your leave request has been approved by the administrator.</p>
          
          <div class="info-box">
            <p><span class="label">Leave Type:</span> ${leaveType}</p>
            <p><span class="label">Start Date:</span> ${startDate}</p>
            <p><span class="label">End Date:</span> ${endDate}</p>
          </div>
          
          <p>Enjoy your time off!</p>
        </div>
        <div class="footer">
          <p>© 2025 IBAYTECH CORP. All rights reserved.</p>
          <p>Time Keeping Management System</p>
        </div>
      </div>
    </body>
    </html>
  `,

  leaveRejected: (employeeName: string, leaveType: string, startDate: string, endDate: string, adminNotes?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0066ff 0%, #003d99 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header .brand { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .brand-accent { color: #ff0000; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .error { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .info-box { background: white; border-left: 4px solid #0066ff; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .label { font-weight: bold; color: #0066ff; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">ibay<span class="brand-accent">tech</span></div>
          <h1>Leave Request Status</h1>
        </div>
        <div class="content">
          <div class="error">
            <p style="margin: 0; font-weight: bold; color: #991b1b;">✗ Your leave request has been rejected.</p>
          </div>
          
          <p>Hello ${employeeName},</p>
          <p>Unfortunately, your leave request could not be approved at this time.</p>
          
          <div class="info-box">
            <p><span class="label">Leave Type:</span> ${leaveType}</p>
            <p><span class="label">Start Date:</span> ${startDate}</p>
            <p><span class="label">End Date:</span> ${endDate}</p>
            ${adminNotes ? `<p><span class="label">Admin Notes:</span> ${adminNotes}</p>` : ''}
          </div>
          
          <p>Please contact HR if you have any questions.</p>
        </div>
        <div class="footer">
          <p>© 2025 IBAYTECH CORP. All rights reserved.</p>
          <p>Time Keeping Management System</p>
        </div>
      </div>
    </body>
    </html>
  `,
  scheduleUpdated: (employeeName: string, schedule: any) => {
    const days = Array.isArray(schedule?.days) ? schedule.days.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') : '';
    const timeIn = schedule?.timeIn || '';
    const lunchStart = schedule?.lunchStart || '';
    const lunchEnd = schedule?.lunchEnd || '';
    const timeOut = schedule?.timeOut || '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(16,24,40,0.08); }
        .header { background: linear-gradient(135deg, #0f1724 0%, #0b1220 100%); color: white; padding: 24px; text-align: left; }
        .brand { font-size: 20px; font-weight: 700; }
        .title { font-size: 18px; margin-top: 8px; }
        .content { padding: 24px; color: #111827; }
        .greet { margin-bottom: 16px; }
        .box { background: #f8fafc; border: 1px solid #e6edf3; padding: 16px; border-radius: 6px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .label { color: #6b7280; font-size: 13px; }
        .value { color: #111827; font-weight: 600; }
        .cta { margin-top: 18px; text-align: center; }
        .btn { display: inline-block; background: #1565d8; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; }
        .footer { padding: 18px; font-size: 12px; color: #6b7280; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">${process.env.NEXT_PUBLIC_APP_NAME || 'IBAYTECH CORP'}</div>
          <div class="title">Your schedule was updated</div>
        </div>
        <div class="content">
          <p class="greet">Hi ${employeeName || ''},</p>
          <p>We've updated your schedule. See the details below.</p>

          <div class="box">
            <div class="row"><div class="label">Days</div><div class="value">${days}</div></div>
            <div class="row"><div class="label">Time In</div><div class="value">${timeIn}</div></div>
            ${lunchStart && lunchEnd ? `<div class="row"><div class="label">Lunch</div><div class="value">${lunchStart} - ${lunchEnd}</div></div>` : ''}
            <div class="row"><div class="label">Time Out</div><div class="value">${timeOut}</div></div>
          </div>

          <div class="cta">
            <a class="btn" href="${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employee/schedule">View My Schedule</a>
          </div>
        </div>
        <div class="footer">Regards,<br/>${process.env.NEXT_PUBLIC_APP_NAME || 'IBAYTECH CORP'}</div>
      </div>
    </body>
    </html>
  `;
  },
};
