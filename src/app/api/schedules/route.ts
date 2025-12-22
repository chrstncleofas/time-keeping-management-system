import * as controller from '@/server/controllers/scheduleController';
import { requireAuth, requireAdmin } from '@/lib/middleware/auth';

export const GET = requireAuth(controller.getSchedules as any);
export const POST = requireAdmin(controller.createSchedule as any);
export const PATCH = requireAdmin(controller.updateSchedule as any);
export const DELETE = requireAdmin(controller.deleteSchedule as any);
