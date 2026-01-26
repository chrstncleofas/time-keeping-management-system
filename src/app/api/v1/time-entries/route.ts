/**
 * API v1 - Time Entries Route
 * @version v1
 * @since 2026-01-26
 */

import { requireAuth } from '@/lib/middleware/auth';
import * as controller from '@/server/controllers/timeEntryController';

// Controller expects user param from requireAuth middleware
export const POST = requireAuth(controller.createEntry);
export const GET = requireAuth(controller.getEntries);
export const PATCH = requireAuth(controller.updateEntry);
