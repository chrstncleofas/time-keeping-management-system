/**
 * API v1 - Absence Route
 * @version v1
 * @since 2026-01-26
 */

import * as controller from '@/server/controllers/absenceController';

// Controllers handle their own auth internally
export const GET = controller.getAbsences;
export const POST = controller.createAbsence;
