'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_PATHS } from '@/lib/api/paths';
import { ISchedule, CreateScheduleDto, UpdateScheduleDto } from '@/types';

interface SchedulesResponse {
  success: boolean;
  schedules: ISchedule[];
}

async function fetchSchedules(userId?: string): Promise<SchedulesResponse> {
  const search = new URLSearchParams();
  if (userId) search.set('userId', userId);
  const path = `${API_PATHS.SCHEDULES.BASE}${search.toString() ? `?${search.toString()}` : ''}`;
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to fetch schedules');
  return res.json();
}

export function useSchedules(userId?: string) {
  return useQuery({ queryKey: ['schedules', userId], queryFn: () => fetchSchedules(userId) });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, CreateScheduleDto, unknown>({
    mutationFn: async (payload: CreateScheduleDto) => {
      const res = await fetch(API_PATHS.SCHEDULES.BASE, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create schedule');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { id: string; updates: UpdateScheduleDto }, unknown>({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateScheduleDto }) => {
      const path = `${API_PATHS.SCHEDULES.BASE}?id=${encodeURIComponent(id)}`;
      const res = await fetch(path, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(updates) 
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update schedule');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string, unknown>({
    mutationFn: async (id: string) => {
      const path = `${API_PATHS.SCHEDULES.BASE}?id=${encodeURIComponent(id)}`;
      const res = await fetch(path, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete schedule');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}
