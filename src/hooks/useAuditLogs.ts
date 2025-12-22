 'use client';

import { useQuery } from '@tanstack/react-query';

export function useAuditLogs(params?: { page?: number; limit?: number; category?: string; action?: string; userId?: string; startDate?: string; endDate?: string; search?: string }) {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) search.set(k, String(v)); });
      }
      const path = `/api/audit-logs${search.toString() ? `?${search.toString()}` : ''}`;
      const res = await fetch(path);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    }
  });
}
