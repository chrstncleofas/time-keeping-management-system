import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchNotifications(token?: string | null) {
  const res = await fetch('/api/notifications', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.json();
}

async function markAllReadApi(token?: string | null) {
  const res = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.json();
}

export function useNotifications() {
  const token = useAuthStore(state => state.token);
  return useQuery<unknown[], Error>({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(token),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    select: (data: any) => data.notifications || [],
  });
}

export function useMarkAllNotifications() {
  const token = useAuthStore(state => state.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllReadApi(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
