/**
 * API v1 - Notifications Route
 * @version v1
 * @since 2026-01-26
 */

import { getNotifications, markAllRead } from '@/server/controllers/notificationController';

// Controllers handle their own auth internally
export const GET = getNotifications;
export const PATCH = markAllRead;
