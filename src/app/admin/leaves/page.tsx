'use client';

import { 
  Clock,
  FileText, 
  XCircle,
  CheckCircle, 
} from 'lucide-react';

import { ILeave } from '@/types';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import React, { useEffect, useState } from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Pagination } from '@/components/shared/Pagination';

export default function AdminLeavesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { settings } = useSystemSettings();
  const router = useRouter();
  const [leaves, setLeaves] = useState<ILeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedLeave, setSelectedLeave] = useState<ILeave | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super-admin')) {
      router.push('/auth/login');
      return;
    }
    
    // Redirect to dashboard if leave management is disabled
    if (settings && !settings.enableFileLeaveRequest) {
      router.push('/admin/dashboard');
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

  const handleApprove = async (leaveId: string) => {
    setProcessing(true);
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/leave/${leaveId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          adminNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Leave request approved');
        setShowModal(false);
        setAdminNotes('');
        fetchLeaves();
      } else {
        toast.error(data.error || 'Failed to approve');
      }
    } catch (error) {
      toast.error('Failed to approve leave request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (leaveId: string) => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/leave/${leaveId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          adminNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Leave request rejected');
        setShowModal(false);
        setAdminNotes('');
        fetchLeaves();
      } else {
        toast.error(data.error || 'Failed to reject');
      }
    } catch (error) {
      toast.error('Failed to reject leave request');
    } finally {
      setProcessing(false);
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    if (filter === 'all') return true;
    return leave.status === filter;
  });

  // Pagination
  const totalItems = filteredLeaves.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeaves = filteredLeaves.slice(startIndex, endIndex);

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

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-red-50 text-red-700';
      case 'vacation':
        return 'bg-blue-50 text-blue-700';
      case 'emergency':
        return 'bg-orange-50 text-orange-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super-admin')) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
        <p className="text-gray-600 mt-1">Review and manage employee leave requests</p>
      </div>

      {/* Filters & Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors`}
                style={filter === status ? { backgroundColor: 'var(--primary-color)', color: '#fff' } : { backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--header-text)' }}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="px-4 py-2 bg-yellow-50 rounded-lg">
              <span className="text-yellow-700 font-medium">
                {leaves.filter(l => l.status === 'pending').length} Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: 'var(--primary-color)', borderTopColor: 'transparent' }}></div>
          <p className="text-gray-600 mt-4">Loading leave requests...</p>
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No leave requests found</p>
        </div>
      ) : (
        <>
        <div className="space-y-4">
          {paginatedLeaves.map((leave) => (
            <div
              key={leave._id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Leave Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">Employee ID: {leave.userId}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLeaveTypeColor(leave.leaveType)}`}>
                          {leave.leaveType}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(leave.startDate), 'MMM dd, yyyy')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <p className="mt-2">
                          <span className="font-medium">Reason:</span> {leave.reason}
                        </p>
                        {leave.adminNotes && (
                          <p className="mt-2" style={{ color: 'var(--primary-color)' }}>
                            <span className="font-medium">Admin Notes:</span> {leave.adminNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {leave.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowModal(true);
                      }}
                      className="flex items-center px-4 py-2 rounded-lg font-medium"
                      style={{ backgroundColor: 'var(--success-color)', color: '#fff' }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {filteredLeaves.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
        </>
      )}

      {/* Review Modal */}
      {showModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Review Leave Request</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <span className="text-sm font-medium text-gray-700">Leave Type:</span>
                <p className="text-gray-900 capitalize">{selectedLeave.leaveType}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Duration:</span>
                <p className="text-gray-900">
                  {format(new Date(selectedLeave.startDate), 'MMM dd, yyyy')} - {format(new Date(selectedLeave.endDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Reason:</span>
                <p className="text-gray-900">{selectedLeave.reason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional for approval, Required for rejection)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add notes here..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(selectedLeave._id)}
                disabled={processing}
                className="flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--success-color)', color: '#fff' }}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {processing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReject(selectedLeave._id)}
                disabled={processing}
                className="flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--danger-color)', color: '#fff' }}
              >
                <XCircle className="w-5 h-5 mr-2" />
                {processing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setAdminNotes('');
                }}
                disabled={processing}
                className="px-4 py-3 rounded-lg font-medium"
                style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--header-text)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
