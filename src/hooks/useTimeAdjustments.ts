import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTimeAdjustments() {
  return useQuery({
    queryKey: ['timeAdjustments'],
    queryFn: async () => {
      const res = await fetch('/api/time-adjustments');
      if (!res.ok) throw new Error('Failed to fetch time adjustments');
      return res.json();
    },
  });
}

export function useCreateTimeAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/time-adjustments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to create time adjustment');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timeAdjustments'] }),
  });
}
