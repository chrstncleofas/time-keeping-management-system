import { getNotifications, markAllRead } from '@/server/controllers/notificationController';

export const GET = getNotifications as any;
export const PATCH = markAllRead as any;
