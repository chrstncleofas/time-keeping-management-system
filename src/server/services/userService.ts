import User from '@/lib/models/User';
import connectDB from '@/lib/db/mongodb';
import SystemSettings from '@/lib/models/SystemSettings';
import { generateEmployeeId } from '@/lib/utils/employee';

const SETTINGS_ID = '000000000000000000000001';

export async function findUsers(filter: any = {}) {
  await connectDB();
  const users = await User.find(filter).sort({ createdAt: -1 });
  return users;
}

export async function createUser(payload: any) {
  await connectDB();
  // If employeeId not provided, generate based on system settings
  if (!payload.employeeId) {
    try {
      const settings = await SystemSettings.findById(SETTINGS_ID);
      const opts = {
        prefix: settings?.employeeIdPrefix ?? 'ibay',
        padding: settings?.employeeIdPadding ?? 4,
        delimiter: settings?.employeeIdDelimiter ?? '-',
        uppercase: settings?.employeeIdUppercase ?? false,
      };

      // Attempt to generate a unique employeeId up to several tries
      let attempts = 0;
      let candidate = '';
      while (attempts < 10) {
        candidate = generateEmployeeId(opts as any);
        // ensure uniqueness
        // eslint-disable-next-line no-await-in-loop
        const exists = await User.findOne({ employeeId: candidate });
        if (!exists) break;
        attempts += 1;
      }
      if (candidate) payload.employeeId = candidate;
    } catch (err) {
      // fallback to random generator
      payload.employeeId = generateEmployeeId();
    }
  }

  const newUser = await User.create(payload);
  return newUser;
}

export async function findUserByEmail(email: string) {
  await connectDB();
  return User.findOne({ email });
}

export async function findUserById(id: string) {
  await connectDB();
  return User.findById(id);
}

export async function updateUserById(id: string, updates: any) {
  await connectDB();
  return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
}

export async function deleteUserById(id: string) {
  await connectDB();
  return User.findByIdAndDelete(id);
}

export async function setUserPassword(id: string, newPassword: string) {
  await connectDB();
  const user = await User.findById(id).select('+password');
  if (!user) return null;
  user.password = newPassword;
  await user.save();
  return user;
}
