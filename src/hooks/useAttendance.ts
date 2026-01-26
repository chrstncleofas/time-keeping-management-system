'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_PATHS } from '@/lib/api/paths';
import { IAttendance } from '@/types';

interface AttendanceParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
}

interface AttendanceResponse {
  success: boolean;
  attendances: IAttendance[];
}

async function fetchAttendances(params: AttendanceParams = {}): Promise<AttendanceResponse> {
  const search = new URLSearchParams();
  if (params.startDate) search.set('startDate', params.startDate);
  if (params.endDate) search.set('endDate', params.endDate);
  if (params.userId) search.set('userId', params.userId);
  const path = `${API_PATHS.ATTENDANCE.BASE}${search.toString() ? `?${search.toString()}` : ''}`;

  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to fetch attendances');
  return res.json();
}

export function useAttendances(params?: AttendanceParams) {
  return useQuery({
    queryKey: ['attendances', params],
    queryFn: () => fetchAttendances(params),
  });
}

export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(API_PATHS.ATTENDANCE.BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create attendance');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendances'] }),
  });
}
