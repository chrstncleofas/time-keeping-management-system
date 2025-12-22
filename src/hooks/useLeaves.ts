import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchLeaves() {
  const res = await fetch('/api/leave');
  if (!res.ok) throw new Error('Failed to fetch leaves');
  return res.json();
}

export function useLeaves() {
  return useQuery({ queryKey: ['leaves'], queryFn: fetchLeaves });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to create leave');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] })
  });
}
