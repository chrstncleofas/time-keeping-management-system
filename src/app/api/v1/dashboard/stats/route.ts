/**
 * API v1 - Dashboard Stats Route
 * @version v1
 * @since 2026-01-26
 */

import * as controller from '@/server/controllers/dashboardController';

// Controller handles auth internally (Admin only)
export const GET = controller.getStats;
