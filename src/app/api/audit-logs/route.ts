import * as controller from '@/server/controllers/auditLogController';
/**
 * GET /api/audit-logs
 * Get audit logs with filters (Admin only)
 */
export const GET = controller.getAuditLogs as any;
