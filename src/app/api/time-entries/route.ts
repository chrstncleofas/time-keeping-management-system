import * as controller from '@/server/controllers/timeEntryController';
import { requireAuth } from '@/lib/middleware/auth';

export const POST = requireAuth(controller.createEntry as any);
export const GET = requireAuth(controller.getEntries as any);
export const PATCH = requireAuth(controller.updateEntry as any);
