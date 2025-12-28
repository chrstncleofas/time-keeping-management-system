'use client';

import { 
  Plus, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';

import { ILeave } from '@/types';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import React, { useEffect, useState } from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export default function EmployeeLeavesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { settings } = useSystemSettings();
  const router = useRouter();
  const [leaves, setLeaves] = useState<ILeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    leaveType: 'sick',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'employee') {
      router.push('/auth/login');
      return;
    }
    
    // Redirect to dashboard if leave management is disabled
    if (settings && !settings.enableFileLeaveRequest) {
      router.push('/employee/dashboard');
      return;
    }
    
    fetchLeaves();
  }, [isAuthenticated, user, router, settings]);

  const fetchLeaves = async () => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/leave', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setLeaves(data.leaves);
      }
    } catch (error: any) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setSubmitting(true);
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Leave request submitted successfully');
        setShowModal(false);
        setFormData({
          leaveType: 'sick',
          startDate: '',
          endDate: '',
          reason: '',
        });
        fetchLeaves();
      } else {
        toast.error(data.error || 'Failed to submit leave request');
      }
    } catch (error) {
      toast.error('Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (leaveId: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) {
      return;
    }

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/leave/${leaveId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Leave request deleted');
        fetchLeaves();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete leave request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated || user?.role !== 'employee') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="text-gray-600 mt-1">
            You have <span className="font-semibold text-primary-700">{user?.leaveCredits || 0}</span> leave credits remaining
          </p>
        </div>
        {settings?.enableFileLeaveRequest && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Request Leave
          </button>
        )}
      </div>

      {/* Leave Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {leaves.filter(l => l.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {leaves.filter(l => l.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {leaves.filter(l => l.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading leave requests...</p>
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No leave requests yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Request Your First Leave
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div
              key={leave._id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leave.status)}`}>
                      {getStatusIcon(leave.status)}
                      {leave.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 capitalize">
                      {leave.leaveType}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {format(new Date(leave.startDate), 'MMM dd, yyyy')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                    </div>
                    <p className="text-gray-700">
                      <span className="font-medium">Reason:</span> {leave.reason}
                    </p>
                    {leave.adminNotes && (
                      <div className="mt-3 p-3 bg-primary-50 rounded-lg">
                        <p className="text-sm text-primary-900">
                          <span className="font-medium">Admin Notes:</span> {leave.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {leave.status === 'pending' && (
                  <button
                    onClick={() => handleDelete(leave._id)}
                    className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Request Leave</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation Leave</option>
                  <option value="emergency">Emergency Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Please provide a reason for your leave..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
