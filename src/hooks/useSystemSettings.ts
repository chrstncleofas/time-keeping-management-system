'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { API_PATHS } from '@/lib/api/paths';
import { ISystemSettings, UpdateSystemSettingsDto } from '@/types';

interface SystemSettingsResponse {
  success: boolean;
  settings: ISystemSettings;
}

export function useSystemSettings() {
  const { token } = useAuthStore();

  const result = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async (): Promise<SystemSettingsResponse> => {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(API_PATHS.SYSTEM_SETTINGS.BASE, { headers });
      if (!res.ok) throw new Error('Failed to fetch system settings');
      return res.json();
    },
  });

  return {
    ...result,
    settings: (result.data && (result.data.settings ?? result.data)) ?? null,
  } as typeof result & { settings: ISystemSettings | null };
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: UpdateSystemSettingsDto) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const { token } = useAuthStore.getState();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(API_PATHS.SYSTEM_SETTINGS.BASE, { 
        method: 'PATCH', 
        headers, 
        body: JSON.stringify(updates) 
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update system settings');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systemSettings'] }),
  });
}
