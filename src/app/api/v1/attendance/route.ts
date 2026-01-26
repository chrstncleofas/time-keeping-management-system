/**
 * API v1 - Attendance Route
 * @version v1
 * @since 2026-01-26
 */

import { requireAuth } from '@/lib/middleware/auth';
import * as controller from '@/server/controllers/attendanceController';

// Controller expects user param from requireAuth middleware
export const GET = requireAuth(controller.getAttendances);
