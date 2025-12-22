import connectDB from '@/lib/db/mongodb';
import Leave from '@/lib/models/Leave';
import User from '@/lib/models/User';
import { format } from 'date-fns';
import { sendEmail, emailTemplates } from '@/lib/utils/email';

export async function findLeavesForUser(user: any) {
  await connectDB();
  if (user.role === 'admin' || user.role === 'super-admin') {
    return Leave.find().sort({ createdAt: -1 }).limit(100);
  }
  return Leave.find({ userId: user._id }).sort({ createdAt: -1 });
}

export async function createLeaveRequest(user: any, payload: any) {
  await connectDB();
  const { leaveType, startDate, endDate, reason } = payload;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) throw new Error('End date must be after start date');

  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const dbUser = await User.findById(user._id);
  if (!dbUser) throw new Error('User not found');
  if (dbUser.leaveCredits < daysDiff) throw new Error(`Insufficient leave credits. You have ${dbUser.leaveCredits} days available.`);

  const leave = await Leave.create({ userId: user._id, leaveType, startDate: start, endDate: end, reason, status: 'pending' });

  // send emails to admins
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super-admin'] }, isActive: true });
    const employeeName = `${dbUser.firstName} ${dbUser.lastName}`;
    const startDateStr = format(start, 'MMM dd, yyyy');
    const endDateStr = format(end, 'MMM dd, yyyy');
    const leaveTypeStr = leaveType.charAt(0).toUpperCase() + leaveType.slice(1);
    for (const admin of admins) {
      await sendEmail({ to: admin.email, subject: `New Leave Request from ${employeeName}`, html: emailTemplates.leaveRequest(employeeName, leaveTypeStr, startDateStr, endDateStr, reason) });
    }
    // create notifications for admins
    try {
      const adminIds = admins.map(a => a._id.toString());
      const title = `New leave request: ${employeeName}`;
      const description = `${employeeName} requested ${leaveTypeStr} from ${startDateStr} to ${endDateStr}`;
      const notificationService = await import('@/server/services/notificationService');
      await notificationService.createNotificationForUsers(adminIds, { actorId: dbUser._id.toString(), title, description, category: 'LEAVE', metadata: { leaveId: leave._id } });
    } catch (err) {
      // swallow notification errors
    }
  } catch (err) {
    // swallow email errors
  }

  return { leave, dbUser, daysDiff };
}
