import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Props {
  open: boolean;
  mode: 'create' | 'credentials';
  initial?: any;
  onClose: () => void;
  onSaved: () => void;
  token?: string;
}

export const UserModal: React.FC<Props> = ({ open, mode, initial = {}, onClose, onSaved, token }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: initial.firstName || '',
    lastName: initial.lastName || '',
    email: initial.email || '',
    role: initial.role || 'employee',
    password: '',
  });

  useEffect(() => {
    // Only reset form when the modal is opened or when the initial user's id changes
    if (!open) return;
    setForm({
      firstName: initial.firstName || '',
      lastName: initial.lastName || '',
      email: initial.email || '',
      role: initial.role || 'employee',
      password: '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, (initial as any)?._id]);

  if (!open) return null;

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      if (mode === 'create') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, role: form.role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Create failed');
      } else if (mode === 'credentials') {
        // allow changing email and/or password together
        const payload: any = { userId: initial._id };
        if (form.email && form.email !== initial.email) payload.email = form.email;
        if (form.password) payload.newPassword = form.password;

        // If only password change, call change-password endpoint
        if (payload.newPassword && !payload.email) {
          const res = await fetch('/api/users/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ userId: initial._id, newPassword: payload.newPassword }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Update failed');
        } else {
          // when email and/or password need updating, call patch user then password
          if (payload.email) {
            const res = await fetch(`/api/users?id=${encodeURIComponent(initial._id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ email: payload.email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');
          }
          if (payload.newPassword) {
            const res = await fetch('/api/users/change-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ userId: initial._id, newPassword: payload.newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');
          }
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
          <div className="p-5 border-b flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{mode === 'create' ? 'Create User' : 'Change Credentials'}</h3>
              <p className="text-sm text-gray-600 mt-1">{mode === 'create' ? 'Provide details for the new user' : 'Update email and/or password for the user'}</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {mode === 'create' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">First name</label>
                  <input required placeholder="First name" value={form.firstName} onChange={e => update('firstName', e.target.value)} className="w-full p-3 border border-gray-200 rounded-md shadow-sm focus:ring-1 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last name</label>
                  <input placeholder="Last name" required value={form.lastName} onChange={e => update('lastName', e.target.value)} className="w-full p-3 border border-gray-200 rounded-md shadow-sm focus:ring-1 focus:ring-primary-500" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Email</label>
                  <input placeholder="Email" required value={form.email} onChange={e => update('email', e.target.value)} className="w-full p-3 border border-gray-200 rounded-md shadow-sm focus:ring-1 focus:ring-primary-500" />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Password</label>
                  <input placeholder="Password" type="password" required value={form.password} onChange={e => update('password', e.target.value)} className="w-full p-3 border border-gray-200 rounded-md shadow-sm focus:ring-1 focus:ring-primary-500" />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Role</label>
                  <select value={form.role} onChange={e => update('role', e.target.value)} className="w-full p-3 border border-gray-200 rounded-md shadow-sm">
                    <option value="employee">employee</option>
                    <option value="admin">admin</option>
                    <option value="super-admin">super-admin</option>
                  </select>
                </div>
              </div>
            )}

            {mode === 'credentials' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">First name</label>
                  <input placeholder="First name" value={form.firstName} onChange={e => update('firstName', e.target.value)} className="w-full p-3 border border-gray-200 rounded-md shadow-sm focus:ring-1 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last name</label>
                  <input placeholder="Last name" value={form.lastName} onChange={e => update('lastName', e.target.value)} className="w-full p-3 border border-gray-200 rounded-md shadow-sm focus:ring-1 focus:ring-primary-500" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Email</label>
                  <input placeholder="Email" value={form.email} onChange={e => update('email', e.target.value)} className="w-full p-3 border border-gray-200 rounded-md shadow-sm focus:ring-1 focus:ring-primary-500" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">New password <span className="text-xs text-gray-400">(leave blank to keep)</span></label>
                  <input placeholder="New password (leave blank to keep)" type="password" value={form.password} onChange={e => update('password', e.target.value)} className="w-full p-3 border border-gray-200 rounded-md shadow-sm focus:ring-1 focus:ring-primary-500" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UserModal;
