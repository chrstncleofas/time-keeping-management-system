import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';

export async function createNotification(payload: {
  recipientId: string;
  actorId?: string;
  title: string;
  description?: string;
  link?: string;
  category?: string;
  metadata?: Record<string, any>;
}) {
  await connectDB();
  const notif = await Notification.create({
    recipient: payload.recipientId,
    actor: payload.actorId,
    title: payload.title,
    description: payload.description,
    link: payload.link,
    category: payload.category,
    metadata: payload.metadata,
  });
  return notif;
}

export async function createNotificationForUsers(userIds: string[], payload: Omit<Parameters<typeof createNotification>[0], 'recipientId'>) {
  await connectDB();
  const notifs = [];
  for (const id of userIds) {
    const n = await createNotification({ recipientId: id, ...payload });
    notifs.push(n);
  }
  return notifs;
}

export async function findNotificationsForUser(userId: string, limit = 50) {
  await connectDB();
  return Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(limit).lean();
}

export async function markAllAsReadForUser(userId: string) {
  await connectDB();
  return Notification.updateMany({ recipient: userId, read: false }, { $set: { read: true } });
}
