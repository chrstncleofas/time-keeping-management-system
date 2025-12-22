 'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

export function useSystemSettings() {
  const { token } = useAuthStore();

  const result = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/system-settings', { headers });
      if (!res.ok) throw new Error('Failed to fetch system settings');
      return res.json();
    },
  });

  return {
    ...result,
    settings: (result.data && (result.data.settings ?? result.data)) ?? null,
  } as typeof result & { settings: any };
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: any) => {
      const headers: any = { 'Content-Type': 'application/json' };
      const { token } = useAuthStore.getState();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/system-settings', { method: 'PATCH', headers, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error('Failed to update system settings');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systemSettings'] }),
  });
}
