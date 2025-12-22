 'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchAttendances(params: { startDate?: string; endDate?: string; userId?: string } = {}) {
  const search = new URLSearchParams();
  if (params.startDate) search.set('startDate', params.startDate);
  if (params.endDate) search.set('endDate', params.endDate);
  if (params.userId) search.set('userId', params.userId);
  const path = `/api/attendance${search.toString() ? `?${search.toString()}` : ''}`;

  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to fetch attendances');
  return res.json();
}

export function useAttendances(params?: { startDate?: string; endDate?: string; userId?: string }) {
  return useQuery({
    queryKey: ['attendances', params],
    queryFn: () => fetchAttendances(params),
  });
}

export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create attendance');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendances'] }),
  });
}
