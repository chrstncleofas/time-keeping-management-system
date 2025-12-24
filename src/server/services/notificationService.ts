import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
import { sendEmail } from '@/lib/utils/email';
import { emailTemplates } from '@/lib/utils/email';

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

  // Send email to recipient if possible
  try {
    const recipient = await User.findById(payload.recipientId).lean();
    if (recipient && recipient.email) {
      const subject = payload.title || 'Notification from TKMS';
      let html = payload.description || '';

      // Use nicer schedule template if available
      try {
        if ((payload.category === 'SCHEDULE' || payload.category === 'schedule') && payload.metadata && payload.metadata.schedule) {
          html = emailTemplates.scheduleUpdated(recipient.firstName || '', payload.metadata.schedule);
        } else {
          html = `
            <p>Hi ${recipient.firstName || ''},</p>
            <p>${payload.description || ''}</p>
            ${payload.link ? `<p><a href=\"${payload.link}\">View details</a></p>` : ''}
            <p>Regards,<br/>${process.env.NEXT_PUBLIC_APP_NAME || 'TKMS'}</p>
          `;
        }
      } catch (e) {
        console.error('build notification email error', e);
      }

      // fire and forget; don't block main flow
      sendEmail({ to: recipient.email, subject, html }).catch((e) => console.error('notify email error', e));
    }
  } catch (e) {
    console.error('notificationService send email error', e);
  }
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
