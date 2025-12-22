'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from 'react-hot-toast';
import { Plus, Clock, CheckCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { Pagination } from '@/components/shared/Pagination';

interface TimeAdjustment {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId?: string;
  };
  adjustmentType: 'early-out' | 'half-day' | 'late-in' | 'other';
  originalTime?: string;
  adjustedTime: string;
  date: string;
  reason: string;
  notes?: string;
  approvedBy: {
    firstName: string;
    lastName: string;
  };
  status: string;
  createdAt: string;
}

export default function TimeAdjustmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { settings } = useSystemSettings();
  const [adjustments, setAdjustments] = useState<TimeAdjustment[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    userId: '',
    adjustmentType: 'early-out',
    adjustedTime: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    notes: '',
    originalTime: '',
  });

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super-admin')) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      const token = useAuthStore.getState().token;
      
      // Fetch adjustments
      const adjustmentsRes = await fetch('/api/time-adjustments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const adjustmentsData = await adjustmentsRes.json();
      
      // Fetch employees (role=employee)
      const employeesRes = await fetch('/api/users?role=employee', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const employeesData = await employeesRes.json();

      if (adjustmentsData.success) {
        setAdjustments(adjustmentsData.adjustments);
      }
      if (employeesData.users) {
        setEmployees(employeesData.users);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!settings?.enableVerbalAgreements) {
      toast.error('Manual time adjustments are disabled');
      return;
    }

    setSubmitting(true);
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/time-adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Time adjustment created successfully');
        setShowModal(false);
        setFormData({
          userId: '',
          adjustmentType: 'early-out',
          adjustedTime: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          reason: '',
          notes: '',
          originalTime: '',
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create adjustment');
      }
    } catch (error) {
      toast.error('Failed to create time adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const getAdjustmentTypeLabel = (type: string) => {
    switch (type) {
      case 'early-out': return 'Early Out';
      case 'half-day': return 'Half Day';
      case 'late-in': return 'Late In';
      default: return 'Other';
    }
  };

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'early-out': return 'bg-orange-100 text-orange-700';
      case 'half-day': return 'bg-blue-100 text-blue-700';
      case 'late-in': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to dashboard if feature is disabled
  if (settings && !settings.enableVerbalAgreements) {
    router.push('/admin/dashboard');
    return null;
  }

  // Pagination
  const totalItems = adjustments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAdjustments = adjustments.slice(startIndex, endIndex);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Adjustments</h1>
          <p className="text-gray-600 mt-1">Manage manual time adjustments for verbal agreements</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Adjustment
        </button>
      </div>

      {/* Adjustments List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {adjustments.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No time adjustments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAdjustments.map((adjustment) => (
                  <tr key={adjustment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {adjustment.userId.firstName} {adjustment.userId.lastName}
                          </div>
                          {adjustment.userId.employeeId && (
                            <div className="text-sm text-gray-500">{adjustment.userId.employeeId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getAdjustmentTypeColor(adjustment.adjustmentType)}`}>
                        {getAdjustmentTypeLabel(adjustment.adjustmentType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(adjustment.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {adjustment.originalTime && (
                        <div className="text-gray-500 line-through">
                          {format(new Date(adjustment.originalTime), 'hh:mm a')}
                        </div>
                      )}
                      <div className="text-gray-900 font-medium">
                        {format(new Date(adjustment.adjustedTime), 'hh:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{adjustment.reason}</div>
                      {adjustment.notes && (
                        <div className="text-gray-500 text-xs mt-1">{adjustment.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {adjustment.approvedBy.firstName} {adjustment.approvedBy.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(adjustment.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {adjustments.length > 0 && (
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
        )}
      </div>

      {/* Add Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Time Adjustment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee *
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} {emp.employeeId ? `(${emp.employeeId})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Type *
                  </label>
                  <select
                    value={formData.adjustmentType}
                    onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {settings?.allowEarlyOut && <option value="early-out">Early Out</option>}
                    {settings?.allowHalfDay && <option value="half-day">Half Day</option>}
                    {settings?.allowLateIn && <option value="late-in">Late In</option>}
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Time (optional)
                  </label>
                  <input
                    type="time"
                    value={formData.originalTime}
                    onChange={(e) => setFormData({ ...formData, originalTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjusted Time *
                  </label>
                  <input
                    type="time"
                    value={formData.adjustedTime}
                    onChange={(e) => setFormData({ ...formData, adjustedTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Verbal agreement for early dismissal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional details..."
                />
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Create Adjustment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
