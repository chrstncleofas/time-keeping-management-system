/**
 * API v1 - Audit Logs Route
 * @version v1
 * @since 2026-01-26
 */

import * as controller from '@/server/controllers/auditLogController';

// Controller handles auth internally (Admin only)
export const GET = controller.getAuditLogs;
