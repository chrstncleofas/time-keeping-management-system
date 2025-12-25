'use client';

import { toast } from '@/lib/toast';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import React, { useEffect, useState } from 'react';
import UserModal from '@/components/admin/UserModal';
import { Pagination } from '@/components/shared/Pagination';

export default function UsersPage() {
  const { token, user, isHydrated, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || user?.role !== 'super-admin') return;
    fetchUsers();
  }, [isHydrated, isAuthenticated, user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getUsers();
      setUsers(res.users || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => setShowAddModal(true);

  const handleOpenEdit = (u: any) => { setEditingUser(u); setEditModalOpen(true); };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredUsers = users.filter(u => `${u.firstName} ${u.lastName} ${u.email} ${u.employeeId || ''}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  if (!isHydrated) return null;
  if (!isAuthenticated || user?.role !== 'super-admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Create and manage system users and admins</p>
        </div>
        <div>
          <button onClick={handleCreateUser} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Create User</button>
        </div>
      </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search users..." className="p-2 border rounded w-full sm:w-64" />
          <div className="text-sm text-gray-500">{users.length} users</div>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {/* Desktop/table view */}
            <div className="hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Active</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(u => (
                    <tr key={u._id} className="border-t">
                      <td className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">{u.firstName?.[0]}{u.lastName?.[0]}</div>
                        <div>
                          <div className="font-medium">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-gray-500">{u.employeeId || ''}</div>
                        </div>
                      </td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.role}</td>
                      <td className="p-3">{u.isActive ? <span className="text-green-600 font-medium">Active</span> : <span className="text-red-600">Disabled</span>}</td>
                      <td className="p-3">
                        <button onClick={() => handleOpenEdit(u)} className="mr-2 px-3 py-1 bg-yellow-100 rounded hover:bg-yellow-200">Change / Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/card view */}
            <div className="sm:hidden space-y-3">
              {paginatedUsers.map(u => (
                <div key={u._id} className="border rounded-lg p-3 bg-white shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-lg">{u.firstName?.[0]}{u.lastName?.[0]}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-gray-500">{u.employeeId || ''}</div>
                        </div>
                        <div className="text-xs text-gray-500">{u.role}</div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">{u.email}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>{u.isActive ? <span className="text-green-600 font-medium">Active</span> : <span className="text-red-600">Disabled</span>}</div>
                        <div>
                          <button onClick={() => handleOpenEdit(u)} className="px-3 py-1 bg-yellow-100 rounded hover:bg-yellow-200">Change</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)))}
              onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            />
          </div>
      </div>
      <UserModal open={showAddModal} mode="create" onClose={() => setShowAddModal(false)} onSaved={fetchUsers} token={token ?? undefined} />
      <UserModal open={editModalOpen} mode="credentials" initial={editingUser || {}} onClose={() => { setEditModalOpen(false); setEditingUser(null); }} onSaved={fetchUsers} token={token ?? undefined} />
    </div>
  );
}
