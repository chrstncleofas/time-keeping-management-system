 'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchAbsences(userId?: string) {
  const search = new URLSearchParams();
  if (userId) search.set('userId', userId);
  const path = `/api/absence${search.toString() ? `?${search.toString()}` : ''}`;
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to fetch absences');
  return res.json();
}

export function useAbsences(userId?: string) {
  return useQuery({ queryKey: ['absences', userId], queryFn: () => fetchAbsences(userId) });
}

export function useCreateAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/absence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to create absence');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
  });
}
