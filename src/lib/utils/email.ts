import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
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
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"IBAYTECH CORP TKMS" <${process.env.SMTP_USER}>`,
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
};
