'use client';

import { useQuery } from '@tanstack/react-query';
import { API_PATHS } from '@/lib/api/paths';
import { IAuditLog } from '@/types';

interface AuditLogParams {
  page?: number;
  limit?: number;
  category?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface AuditLogsResponse {
  success: boolean;
  logs: IAuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: async (): Promise<AuditLogsResponse> => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => { 
          if (v !== undefined && v !== null) searchParams.set(k, String(v)); 
        });
      }
      const path = `${API_PATHS.AUDIT_LOGS.BASE}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const res = await fetch(path);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    }
  });
}
