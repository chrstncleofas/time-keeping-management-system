import { requireAuth } from '@/lib/middleware/auth';
import * as controller from '@/server/controllers/attendanceController';

export const GET = requireAuth(controller.getAttendances as any);
