'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_PATHS } from '@/lib/api/paths';
import { ITimeEntry, CreateTimeEntryDto } from '@/types';

interface TimeEntryParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
}

interface TimeEntriesResponse {
  success: boolean;
  entries: ITimeEntry[];
}

async function fetchTimeEntries(params: TimeEntryParams = {}): Promise<TimeEntriesResponse> {
  const search = new URLSearchParams();
  if (params.startDate) search.set('startDate', params.startDate);
  if (params.endDate) search.set('endDate', params.endDate);
  if (params.userId) search.set('userId', params.userId);
  const path = `${API_PATHS.TIME_ENTRIES.BASE}${search.toString() ? `?${search.toString()}` : ''}`;
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to fetch time entries');
  return res.json();
}

export function useTimeEntries(params?: TimeEntryParams) {
  return useQuery({
    queryKey: ['timeEntries', params],
    queryFn: () => fetchTimeEntries(params),
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, CreateTimeEntryDto>({
    mutationFn: async (payload: CreateTimeEntryDto) => {
      const res = await fetch(API_PATHS.TIME_ENTRIES.BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create time entry');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timeEntries'] }),
  });
}
