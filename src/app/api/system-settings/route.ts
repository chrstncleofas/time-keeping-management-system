import * as controller from '@/server/controllers/systemSettingsController';
import { requireAuth } from '@/lib/middleware/auth';

// Allow public GET so branding can be loaded on public pages (login)
export const GET = controller.getSettings as any;
// Keep PATCH protected
export const PATCH = requireAuth(controller.updateSettings as any);
