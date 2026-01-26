'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_PATHS } from '@/lib/api/paths';
import { ILeave, CreateLeaveDto } from '@/types';

interface LeavesResponse {
  success: boolean;
  leaves: ILeave[];
}

async function fetchLeaves(): Promise<LeavesResponse> {
  const res = await fetch(API_PATHS.LEAVES.BASE);
  if (!res.ok) throw new Error('Failed to fetch leaves');
  return res.json();
}

export function useLeaves() {
  return useQuery({ queryKey: ['leaves'], queryFn: fetchLeaves });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateLeaveDto) => {
      const res = await fetch(API_PATHS.LEAVES.BASE, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create leave');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] })
  });
}
