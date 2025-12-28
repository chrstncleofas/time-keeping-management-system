'use client';

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, useParams } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Shield,
  Save,
  ArrowLeft,
  Trash2,
  UserX,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';

interface UserData {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  employeeId: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  mobileNumber?: string;
  sss?: string;
  philhealth?: string;
  pagibig?: string;
  tin?: string;
  photoUrl?: string;
  leaveCredits: number;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function EditEmployeePage() {
  const { user, token, isHydrated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;

  const [employee, setEmployee] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    birthday: '',
    gender: 'male' as 'male' | 'female' | 'other',
    sss: '',
    philhealth: '',
    pagibig: '',
    tin: '',
    leaveCredits: 5,
    isActive: true,
  });

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
      router.push('/auth/login');
      return;
    }
    fetchEmployee();
  }, [isHydrated, user]);

  // Client-side mount for admin DTR button
  React.useEffect(() => {
    // lazy-load the button so we don't bloat SSR
    (async () => {
      try {
        const el = document.getElementById('admin-dtr-button');
        if (!el) return;
        // Only show DTR download button for super-admin users
        if (user?.role !== 'super-admin') return;
        // Avoid double-mounting in React StrictMode (dev) or if effect runs multiple times
        if ((el as HTMLElement).dataset.dtrMounted === '1') return;
        const mod = await import('@/components/shared/DtrDownloadButton');
        // fetch attendance for employee for current month
        const start = new Date();
        const startDate = new Date(start.getFullYear(), start.getMonth(), 1).toISOString();
        const endDate = new Date(start.getFullYear(), start.getMonth() + 1, 0).toISOString();
        const resp = await fetch(`/api/attendance?userId=${employee?._id || ''}&startDate=${startDate}&endDate=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json();
        const container = document.createElement('div');
        el.appendChild(container);
        (el as HTMLElement).dataset.dtrMounted = '1';
        // @ts-ignore
        createRoot(container).render(
          // @ts-ignore
          React.createElement(mod.default, {
            employeeName: employee ? `${employee.firstName} ${employee.lastName}` : '',
            employeeId: employee?._id,
            attendanceRecords: data.attendances || [],
            periodStart: new Date(start.getFullYear(), start.getMonth(), 1),
            periodEnd: new Date(start.getFullYear(), start.getMonth() + 1, 0),
          })
        );
      } catch (e) {
        // ignore lazy mount errors
      }
    })();
  }, [employee, token]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployee(data.user);
        setFormData({
          firstName: data.user.firstName || '',
          middleName: data.user.middleName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          mobileNumber: data.user.mobileNumber || '',
          birthday: data.user.birthday ? format(new Date(data.user.birthday), 'yyyy-MM-dd') : '',
          gender: data.user.gender || 'male',
          sss: data.user.sss || '',
          philhealth: data.user.philhealth || '',
          pagibig: data.user.pagibig || '',
          tin: data.user.tin || '',
          leaveCredits: data.user.leaveCredits || 5,
          isActive: data.user.isActive ?? true,
        });
      } else {
        toast.error('Employee not found');
        router.push('/admin/employees');
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      toast.error('Failed to load employee data');
      router.push('/admin/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/users/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Employee updated successfully!');
        router.push('/admin/employees');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update employee');
      }
    } catch (error) {
      toast.error('Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = !formData.isActive;
    
    try {
      const response = await fetch(`/api/users/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (response.ok) {
        toast.success(`Employee ${newStatus ? 'enabled' : 'disabled'} successfully!`);
        setFormData({ ...formData, isActive: newStatus });
        if (employee) {
          setEmployee({ ...employee, isActive: newStatus });
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/users/${employeeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Employee deleted successfully!');
        router.push('/admin/employees');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete employee');
      }
    } catch (error) {
      toast.error('Failed to delete employee');
    }
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }


  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/employees')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Employees
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserIcon className="w-8 h-8 text-primary-600" />
              Edit Employee
            </h1>
            <p className="text-gray-600 mt-2">Update employee information</p>
          </div>
          <div className="flex items-center gap-3">
            {/* DTR download will fetch attendance for this employee via client-side if needed */}
            <div>
              {/* @ts-ignore - dynamic import not required here */}
              <script />
            </div>
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                formData.isActive
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {formData.isActive ? (
                <>
                  <UserX className="w-4 h-4" />
                  Disable Employee
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Enable Employee
                </>
              )}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <div>
              {/* Place DTR button here for admins (requires attendance fetch) */}
              {/* We'll render a client-only button to avoid SSR issues */}
              <div id="admin-dtr-button" />
            </div>
          </div>
        </div>
      </div>

      {/* Employee Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header with Status */}
        <div className={`p-6 text-white ${formData.isActive ? 'bg-gradient-to-r from-primary-600 to-primary-700' : 'bg-gradient-to-r from-gray-600 to-gray-700'}`}>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-primary-700 font-bold text-3xl">
              {formData.firstName[0]}{formData.lastName[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {employee.firstName} {employee.middleName ? `${employee.middleName[0]}. ` : ''}{employee.lastName}
              </h2>
              <p className="text-primary-100 mt-1">{employee.employeeId}</p>
              <div className="mt-2 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                <Shield className="w-4 h-4" />
                {formData.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Basic Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Middle Name
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Mobile Number
              </label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="+63 9XX XXX XXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Birthday
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="w-4 h-4 inline mr-2" />
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Credits
              </label>
              <input
                type="number"
                value={formData.leaveCredits}
                onChange={(e) => setFormData({ ...formData, leaveCredits: parseInt(e.target.value) })}
                min="0"
                max="30"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Government IDs */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Government IDs
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                SSS Number
              </label>
              <input
                type="text"
                value={formData.sss}
                onChange={(e) => setFormData({ ...formData, sss: e.target.value })}
                placeholder="XX-XXXXXXX-X"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                PhilHealth Number
              </label>
              <input
                type="text"
                value={formData.philhealth}
                onChange={(e) => setFormData({ ...formData, philhealth: e.target.value })}
                placeholder="XX-XXXXXXXXX-X"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Pag-IBIG Number
              </label>
              <input
                type="text"
                value={formData.pagibig}
                onChange={(e) => setFormData({ ...formData, pagibig: e.target.value })}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                TIN Number
              </label>
              <input
                type="text"
                value={formData.tin}
                onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                placeholder="XXX-XXX-XXX-XXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Account Information */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Account Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                {employee.employeeId}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Since
              </label>
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                {format(new Date(employee.createdAt), 'MMMM dd, yyyy')}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/admin/employees')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{employee.firstName} {employee.lastName}</strong>? 
              This action cannot be undone and will permanently remove all associated data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
