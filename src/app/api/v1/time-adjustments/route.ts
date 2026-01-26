/**
 * API v1 - Time Adjustments Route
 * @version v1
 * @since 2026-01-26
 */

import * as controller from '@/server/controllers/timeAdjustmentController';

// Controllers handle their own auth internally
export const GET = controller.getAdjustments;
export const POST = controller.createAdjustment;
