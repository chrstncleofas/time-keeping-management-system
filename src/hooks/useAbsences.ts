'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_PATHS } from '@/lib/api/paths';
import { IAbsence, CreateAbsenceDto } from '@/types';

interface AbsencesResponse {
  success: boolean;
  absences: IAbsence[];
}

async function fetchAbsences(userId?: string): Promise<AbsencesResponse> {
  const search = new URLSearchParams();
  if (userId) search.set('userId', userId);
  const path = `${API_PATHS.ABSENCE.BASE}${search.toString() ? `?${search.toString()}` : ''}`;
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
    mutationFn: async (payload: CreateAbsenceDto) => {
      const res = await fetch(API_PATHS.ABSENCE.BASE, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create absence');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
  });
}
