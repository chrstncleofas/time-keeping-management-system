 'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchSchedules(userId?: string) {
  const search = new URLSearchParams();
  if (userId) search.set('userId', userId);
  const path = `/api/schedules${search.toString() ? `?${search.toString()}` : ''}`;
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to fetch schedules');
  return res.json();
}

export function useSchedules(userId?: string) {
  return useQuery({ queryKey: ['schedules', userId], queryFn: () => fetchSchedules(userId) });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation<any, Error, any, unknown>({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to create schedule');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation<any, Error, any, unknown>({
    mutationFn: async ({ id, updates }: any) => {
      const path = `/api/schedules?id=${encodeURIComponent(id)}`;
      const res = await fetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error('Failed to update schedule');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation<any, Error, string, unknown>({
    mutationFn: async (id: string) => {
      const path = `/api/schedules?id=${encodeURIComponent(id)}`;
      const res = await fetch(path, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete schedule');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}
