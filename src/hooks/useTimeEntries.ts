 'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchTimeEntries(params: { startDate?: string; endDate?: string; userId?: string } = {}) {
  const search = new URLSearchParams();
  if (params.startDate) search.set('startDate', params.startDate);
  if (params.endDate) search.set('endDate', params.endDate);
  if (params.userId) search.set('userId', params.userId);
  const path = `/api/time-entries${search.toString() ? `?${search.toString()}` : ''}`;
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to fetch time entries');
  return res.json();
}

export function useTimeEntries(params?: { startDate?: string; endDate?: string; userId?: string }) {
  return useQuery({
    queryKey: ['timeEntries', params],
    queryFn: () => fetchTimeEntries(params),
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create time entry');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timeEntries'] }),
  });
}
