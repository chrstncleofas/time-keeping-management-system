import crypto from 'crypto';
import User from '@/lib/models/User';
import connectDB from '@/lib/db/mongodb';
import { sendEmail } from '@/lib/utils/email';

export async function findUserByEmail(email: string) {
  await connectDB();
  return User.findOne({ email }).select('+password');
}

export async function createUser(payload: { firstName: string; lastName: string; email: string; password: string; role?: string }) {
  await connectDB();
  const existing = await User.findOne({ email: payload.email });
  if (existing) throw new Error('User already exists');
  const user = new User({ ...payload, role: payload.role || 'employee', isActive: true });
  await user.save();
  return user;
}

export async function requestPasswordReset(email: string) {
  await connectDB();
  // Do not reveal whether the email exists to the client
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return { success: true, message: 'If an account exists, a reset link has been sent' };
  }

  // Generate token and expiry (1 hour)
  const token = crypto.randomBytes(20).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  user.resetPasswordToken = token;
  user.resetPasswordExpiry = expiry;
  await user.save();

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/auth/reset-password?token=${token}`;

  const html = `
    <p>Hello ${user.firstName || ''},</p>
    <p>We received a request to reset your password. Click the link below to set a new password. This link will expire in 1 hour.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <p>Regards,<br/>${process.env.NEXT_PUBLIC_APP_NAME || 'TKMS'}</p>
  `;

  try {
    await sendEmail({ to: user.email, subject: 'Password reset instructions', html });
  } catch (e) {
    // swallow errors to avoid leaking info, but log server-side
    console.error('Failed sending password reset email', e);
  }

  const resp: any = { success: true, message: 'If an account exists, a reset link has been sent' };
  if (process.env.NODE_ENV !== 'production') resp.resetUrl = resetUrl;
  return resp;
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  await connectDB();
  if (!token || !newPassword) return { success: false, error: 'Missing token or password' };

  const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpiry: { $gt: new Date() } }).select('+password');
  if (!user) return { success: false, error: 'Invalid or expired token' };

  user.password = newPassword;
  user.resetPasswordToken = undefined as any;
  user.resetPasswordExpiry = undefined as any;
  await user.save();

  try {
    const html = `
      <p>Hello ${user.firstName || ''},</p>
      <p>Your password has been successfully changed. If you did not perform this action, please contact your administrator immediately.</p>
      <p>Regards,<br/>${process.env.NEXT_PUBLIC_APP_NAME || 'TKMS'}</p>
    `;
    await sendEmail({ to: user.email, subject: 'Your password was changed', html });
  } catch (e) {
    console.error('Failed sending password changed email', e);
  }

  return { success: true, message: 'Password updated successfully' };
}
