/**
 * API v1 - System Settings Route
 * @version v1
 * @since 2026-01-26
 */

import * as controller from '@/server/controllers/systemSettingsController';
import { requireAuth } from '@/lib/middleware/auth';

// Allow public GET so branding can be loaded on public pages (login)
export const GET = controller.getSettings;
// Keep PATCH protected
export const PATCH = requireAuth(controller.updateSettings);
