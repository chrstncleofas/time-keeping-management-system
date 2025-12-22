import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';

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
  // Placeholder: implement token creation + email
  return { success: true };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  await connectDB();
  // Placeholder: validate token and update password
  return { success: true };
}
