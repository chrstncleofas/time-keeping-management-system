/**
 * API v1 - Schedules Route
 * @version v1
 * @since 2026-01-26
 */

import { requireAuth, requireAdmin } from '@/lib/middleware/auth';
import * as controller from '@/server/controllers/scheduleController';

// Controllers expect user param from middleware
export const GET = requireAuth(controller.getSchedules);
export const POST = requireAdmin(controller.createSchedule);
export const PATCH = requireAdmin(controller.updateSchedule);
export const DELETE = requireAdmin(controller.deleteSchedule);
