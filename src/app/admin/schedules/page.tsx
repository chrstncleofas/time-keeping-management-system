'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Plus, Edit, Trash2, Users, Save, X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ISchedule, DayOfWeek } from '@/types';
import { Pagination } from '@/components/shared/Pagination';
import ConfirmModal from '@/components/shared/ConfirmModal';

interface UserInfo {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

interface ScheduleWithUser extends Omit<ISchedule, 'userId'> {
  userId: UserInfo;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AdminSchedulesPage() {
  const { token } = useAuthStore();
  const [schedules, setSchedules] = useState<ScheduleWithUser[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleWithUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    userId: '',
    days: [] as DayOfWeek[],
    timeIn: '08:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    timeOut: '17:00',
  });

  useEffect(() => {
    fetchEmployees();
    fetchSchedules();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/users?role=employee', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setEmployees(data.users);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (schedule?: ScheduleWithUser) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        userId: typeof schedule.userId === 'string' ? schedule.userId : schedule.userId._id,
        days: schedule.days,
        timeIn: schedule.timeIn,
        lunchStart: schedule.lunchStart || '12:00',
        lunchEnd: schedule.lunchEnd || '13:00',
        timeOut: schedule.timeOut,
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        userId: '',
        days: [],
        timeIn: '08:00',
        lunchStart: '12:00',
        lunchEnd: '13:00',
        timeOut: '17:00',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({
      userId: '',
      days: [],
      timeIn: '08:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      timeOut: '17:00',
    });
  };

  const handleDayToggle = (day: DayOfWeek) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || formData.days.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const url = editingSchedule
        ? `/api/schedule/${editingSchedule._id}`
        : '/api/schedule';

      const method = editingSchedule ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Schedule ${editingSchedule ? 'updated' : 'created'} successfully`);
        handleCloseModal();
        fetchSchedules();
      } else {
        toast.error(data.error || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    }
  };

  const handleDelete = async (scheduleId: string) => {
    // NOTE: This function now performs the API deletion directly.
    try {
      const response = await fetch(`/api/schedule/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Schedule deleted successfully');
        fetchSchedules();
      } else {
        toast.error(data.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const openConfirm = (id: string) => {
    setConfirmDeleteId(id);
    setShowConfirm(true);
  };

  const onConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setShowConfirm(false);
    await handleDelete(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const onCancelDelete = () => {
    setShowConfirm(false);
    setConfirmDeleteId(null);
  };

  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1, 3);
  };

  const employeesWithSchedules = schedules
    .map(s => (typeof s.userId === 'string' ? s.userId : s.userId?._id))
    .filter(Boolean) as string[];
  const employeesWithoutSchedules = employees.filter(
    emp => !employeesWithSchedules.includes(emp._id)
  );

  // Pagination
  const totalItems = schedules.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSchedules = schedules.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600 mt-1">Create and manage employee work schedules</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add Schedule</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-primary-600">{employees.length}</p>
            </div>
            <Users className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Schedules</p>
              <p className="text-2xl font-bold text-green-600">{schedules.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Without Schedules</p>
              <p className="text-2xl font-bold text-yellow-600">{employeesWithoutSchedules.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No schedules created yet</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Create your first schedule
            </button>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule._id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {schedule.userId ? `${schedule.userId.firstName} ${schedule.userId.lastName}` : 'Unknown user'}
                  </h3>
                  <p className="text-sm text-gray-500">{schedule.userId ? schedule.userId.employeeId : '—'}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenModal(schedule)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openConfirm(schedule._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Time */}
              <div className="mb-4">
                {schedule.lunchStart && schedule.lunchEnd ? (
                  // Schedule with lunch break
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Clock className="w-4 h-4 text-primary-600" />
                      <span className="text-sm font-medium">{schedule.timeIn}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-medium">{schedule.lunchStart}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Morning</span>
                    </div>
                    <div className="flex items-center space-x-3 text-orange-600 pl-6">
                      <span className="text-xs">🍽️</span>
                      <span className="text-sm font-medium">{schedule.lunchStart}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-medium">{schedule.lunchEnd}</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Lunch</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Clock className="w-4 h-4 text-accent-500" />
                      <span className="text-sm font-medium">{schedule.lunchEnd}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-medium">{schedule.timeOut}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Afternoon</span>
                    </div>
                  </div>
                ) : (
                  // Regular schedule without lunch break
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-4 h-4 mr-2 text-primary-600" />
                      <span className="text-sm font-medium">{schedule.timeIn}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-4 h-4 mr-2 text-accent-500" />
                      <span className="text-sm font-medium">{schedule.timeOut}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Days */}
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <span
                    key={day}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      schedule.days.includes(day)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {getDayLabel(day)}
                  </span>
                ))}
              </div>

              {/* Status */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  schedule.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {schedule.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Pagination */}
      {schedules.length > 0 && (
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
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Employee Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee *
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  disabled={!!editingSchedule}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time In */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time In *
                </label>
                <input
                  type="time"
                  value={formData.timeIn}
                  onChange={(e) => setFormData({ ...formData, timeIn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Lunch Break Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lunch Start (Optional)
                </label>
                <input
                  type="time"
                  value={formData.lunchStart}
                  onChange={(e) => setFormData({ ...formData, lunchStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Start of lunch break (e.g., 12:00)</p>
              </div>

              {/* Lunch Break End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lunch End (Optional)
                </label>
                <input
                  type="time"
                  value={formData.lunchEnd}
                  onChange={(e) => setFormData({ ...formData, lunchEnd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">End of lunch break (e.g., 13:00)</p>
              </div>

              {/* Time Out */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Out *
                </label>
                <input
                  type="time"
                  value={formData.timeOut}
                  onChange={(e) => setFormData({ ...formData, timeOut: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Working Days *
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.days.includes(day)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSchedule ? 'Update' : 'Create'} Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirm}
        title="Delete Schedule"
        description="Are you sure you want to delete this schedule? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </div>
  );
}
