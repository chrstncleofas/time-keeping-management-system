'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_PATHS } from '@/lib/api/paths';
import { ITimeAdjustment, CreateTimeAdjustmentDto } from '@/types';

interface TimeAdjustmentsResponse {
  success: boolean;
  adjustments: ITimeAdjustment[];
}

export function useTimeAdjustments() {
  return useQuery({
    queryKey: ['timeAdjustments'],
    queryFn: async (): Promise<TimeAdjustmentsResponse> => {
      const res = await fetch(API_PATHS.TIME_ADJUSTMENTS.BASE);
      if (!res.ok) throw new Error('Failed to fetch time adjustments');
      return res.json();
    },
  });
}

export function useCreateTimeAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTimeAdjustmentDto) => {
      const res = await fetch(API_PATHS.TIME_ADJUSTMENTS.BASE, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create time adjustment');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timeAdjustments'] }),
  });
}
