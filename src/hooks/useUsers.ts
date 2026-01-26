'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_PATHS } from '@/lib/api/paths';
import { IUser, CreateUserDto, UpdateUserDto } from '@/types';

interface UsersResponse {
  success: boolean;
  users: IUser[];
}

async function fetchUsers(role?: string): Promise<UsersResponse> {
  const search = new URLSearchParams();
  if (role) search.set('role', role);
  const path = `${API_PATHS.USERS.BASE}${search.toString() ? `?${search.toString()}` : ''}`;
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export function useUsers(role?: string) {
  return useQuery({
    queryKey: ['users', role],
    queryFn: () => fetchUsers(role),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserDto) => {
      const res = await fetch(API_PATHS.USERS.BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create user');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateUserDto }) => {
      const path = `${API_PATHS.USERS.BASE}?id=${encodeURIComponent(id)}`;
      const res = await fetch(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update user');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const path = `${API_PATHS.USERS.BASE}?id=${encodeURIComponent(id)}`;
      const res = await fetch(path, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
