'use client';

import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';
import React, { useEffect, useState } from 'react';
import DtrPreview from '@/components/shared/DtrPreview';
import { Pagination } from '@/components/shared/Pagination';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ISchedule } from '@/types';
import DtrDownloadButton from '@/components/shared/DtrDownloadButton';
import AttendanceCaptureModal from '@/components/shared/AttendanceCaptureModal';
import { Calendar, Clock, Download, Filter, Search, UserCheck, UserX, Eye } from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  userId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    employeeId?: string;
  } | null;
  date: string;
  timeIn?: {
    timestamp: string;
  };
  timeOut?: {
    timestamp: string;
  };
  totalHours?: number;
  lunchBreakMinutes?: number;
  workedHours?: number;
  overtimeMinutes?: number;
  overtimeHours?: number;
  isLate: boolean;
  isEarlyOut: boolean;
  status: 'present' | 'absent' | 'on-leave' | 'holiday';
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export default function AdminAttendancePage() {
  const { token } = useAuthStore();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [cutoff, setCutoff] = useState<'1-15' | '16-end'>(() => {
    const today = new Date();
    const isCurrentMonth = selectedMonth.getFullYear() === today.getFullYear() && selectedMonth.getMonth() === today.getMonth();
    return isCurrentMonth && today.getDate() > 15 ? '16-end' : '1-15';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDtrModalOpen, setDtrModalOpen] = useState(false);
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [selectorEmployee, setSelectorEmployee] = useState<string | null>(null);
  const [selectorMonth, setSelectorMonth] = useState<Date>(new Date());
  const [selectorCutoff, setSelectorCutoff] = useState<'1-15' | '16-end'>(() => {
    const today = new Date();
    const isCurrentMonth = selectorMonth?.getFullYear() === today.getFullYear() && selectorMonth?.getMonth() === today.getMonth();
    return isCurrentMonth && today.getDate() > 15 ? '16-end' : '1-15';
  });
  const [selectorAttendance, setSelectorAttendance] = useState<AttendanceRecord[]>([]);
  const [selectorLoading, setSelectorLoading] = useState(false);
  const [selectedEmployeeSchedule, setSelectedEmployeeSchedule] = useState<ISchedule | null>(null);
  const [selectorEmployeeSchedule, setSelectorEmployeeSchedule] = useState<ISchedule | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchAttendance();
    }
  }, [selectedEmployee, selectedMonth]);

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

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(selectedMonth).toISOString();
      const endDate = endOfMonth(selectedMonth).toISOString();

      const url = selectedEmployee === 'all'
        ? `/api/attendance?startDate=${startDate}&endDate=${endDate}`
        : `/api/attendance?userId=${selectedEmployee}&startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAttendanceRecords(data.attendances);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleForUser = async (userId: string | null, setter: (s: ISchedule | null) => void) => {
    if (!userId) return setter(null);
    try {
      const resp = await fetch(`/api/schedule?userId=${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      if (data.success && data.schedules && data.schedules.length > 0) {
        setter(data.schedules[0]);
      } else {
        setter(null);
      }
    } catch (err) {
      console.error('Error fetching schedule for user', userId, err);
      setter(null);
    }
  };

  useEffect(() => {
    if (isDtrModalOpen && selectedEmployee && selectedEmployee !== 'all') {
      fetchScheduleForUser(selectedEmployee, setSelectedEmployeeSchedule);
    }
  }, [isDtrModalOpen, selectedEmployee]);

  const getStatusBadge = (status: string) => {
    const badges = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      'on-leave': 'bg-yellow-100 text-yellow-800',
      holiday: 'bg-blue-100 text-blue-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const filteredRecords = attendanceRecords.filter(record => {
    if (!searchQuery) return true;
    const fullName = `${record.userId?.firstName ?? ''} ${record.userId?.lastName ?? ''}`.trim().toLowerCase();
    const empId = (record.userId?.employeeId ?? '').toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || empId.includes(searchQuery.toLowerCase());
  });

  // Pagination
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const stats = {
    totalPresent: filteredRecords.filter(r => r.status === 'present').length,
    totalAbsent: filteredRecords.filter(r => r.status === 'absent').length,
    totalLate: filteredRecords.filter(r => r.isLate).length,
    totalOnLeave: filteredRecords.filter(r => r.status === 'on-leave').length,
    totalOvertimeHours: filteredRecords.reduce((sum, r) => sum + (r.overtimeHours ?? 0), 0),
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Employee ID', 'Name', 'Time In', 'Time Out', 'Duration', 'Break', 'Worked', 'OT', 'Status', 'Late'];
    const rows = filteredRecords.map(record => {
      const lunch = record.lunchBreakMinutes ?? 0;
      const empId = record.userId?.employeeId ?? '';
      const name = record.userId ? `${record.userId.firstName ?? ''} ${record.userId.lastName ?? ''}`.trim() : 'Unknown';
      return [
        format(parseISO(record.date), 'yyyy-MM-dd'),
        empId,
        name,
        record.timeIn ? format(parseISO(record.timeIn.timestamp), 'HH:mm') : '-',
        record.timeOut ? format(parseISO(record.timeOut.timestamp), 'HH:mm') : '-',
        record.totalHours ? record.totalHours.toFixed(2) : '-',
        lunch > 0 ? `-${lunch}min` : '-',
        record.workedHours ? record.workedHours.toFixed(2) : '-',
        record.overtimeHours ? record.overtimeHours.toFixed(2) : '-',
        record.status,
        record.isLate ? 'Yes' : 'No',
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(selectedMonth, 'yyyy-MM')}.csv`;
    a.click();
    toast.success('Attendance report exported');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Track and monitor employee attendance</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowSelectorModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-white border rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Preview DTR (Select Employee)</span>
          </button>
          {selectedEmployee !== 'all' ? (
            <button
              onClick={() => setDtrModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 focus:outline-none"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Preview & Download DTR</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalPresent}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">OT Hours</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.totalOvertimeHours.toFixed(2)}</p>
            </div>
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalAbsent}</p>
            </div>
            <UserX className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.totalLate}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalOnLeave}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Employee Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          {/* Month & cut-off moved into DTR modal to avoid duplicate preview */}

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Attendance List */}
      {/* Inline DTR preview removed — use modal preview */}

      {/* Admin DTR Modal */}
      {isDtrModalOpen && selectedEmployee !== 'all' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDtrModalOpen(false)} aria-hidden />
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-lg shadow-lg p-3 sm:p-4 overflow-auto">
            <div className="flex items-start justify-between mb-2 gap-3">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold">Preview DTR - {employees.find(e => e._id === selectedEmployee)?.firstName} {employees.find(e => e._id === selectedEmployee)?.lastName}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{format(selectedMonth, 'MMMM yyyy')} — {cutoff === '1-15' ? '1 - 15' : '16 - end'}</p>
              </div>
              <button onClick={() => setDtrModalOpen(false)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>

            <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Month</label>
                <input
                  type="month"
                  value={format(selectedMonth, 'yyyy-MM')}
                  onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cut-off</label>
                <select
                  value={cutoff}
                  onChange={(e) => setCutoff(e.target.value as '1-15' | '16-end')}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="1-15">1 - 15</option>
                  <option value="16-end">16 - end</option>
                </select>
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <button onClick={() => setDtrModalOpen(false)} className="px-2 py-1 rounded-md bg-gray-100 mr-2 text-sm">Cancel</button>
                <DtrDownloadButton
                  employeeName={(employees.find(e => e._id === selectedEmployee)?.firstName ?? '') + ' ' + (employees.find(e => e._id === selectedEmployee)?.lastName ?? '')}
                  employeeId={selectedEmployee}
                  attendanceRecords={attendanceRecords}
                  periodStart={cutoff === '1-15' ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1) : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 16)}
                  periodEnd={cutoff === '1-15' ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 15) : endOfMonth(selectedMonth)}
                  filename={`DTR-${selectedEmployee}-${format(selectedMonth, 'yyyy-MM')}-${cutoff}`}
                />
              </div>
            </div>

            <div className="mb-4">
              <DtrPreview
                attendanceRecords={attendanceRecords}
                periodStart={cutoff === '1-15' ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1) : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 16)}
                periodEnd={cutoff === '1-15' ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 15) : endOfMonth(selectedMonth)}
                schedule={selectedEmployeeSchedule ? { lunchStart: selectedEmployeeSchedule.lunchStart, lunchEnd: selectedEmployeeSchedule.lunchEnd } : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Selector Modal for Admin/Super-admin to pick employee + month/cutoff */}
      {showSelectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSelectorModal(false)} aria-hidden />
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-lg shadow-lg p-3 sm:p-4 overflow-auto">
            <div className="flex items-start justify-between mb-2 gap-3">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold">Preview & Download DTR (Select Employee)</h3>
                <p className="text-xs sm:text-sm text-gray-500">Choose an employee, month, and cut-off to preview and download DTR</p>
              </div>
              <button onClick={() => setShowSelectorModal(false)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>

            <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Employee</label>
                <select
                  value={selectorEmployee ?? ''}
                  onChange={(e) => setSelectorEmployee(e.target.value || null)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Month</label>
                <input
                  type="month"
                  value={format(selectorMonth, 'yyyy-MM')}
                  onChange={(e) => setSelectorMonth(new Date(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cut-off</label>
                <select
                  value={selectorCutoff}
                  onChange={(e) => setSelectorCutoff(e.target.value as '1-15' | '16-end')}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="1-15">1 - 15</option>
                  <option value="16-end">16 - end</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mb-4">
              <button onClick={() => setShowSelectorModal(false)} className="px-2 py-1 rounded-md bg-gray-100 text-sm">Cancel</button>
              <button
                onClick={async () => {
                  if (!selectorEmployee) return toast.error('Please select an employee');
                  try {
                    setSelectorLoading(true);
                    const year = selectorMonth.getFullYear();
                    const month = selectorMonth.getMonth();
                    const startDateObj = new Date(year, month, 1);
                    const endDateObj = new Date(year, month + 1, 0);
                    const startDate = startDateObj.toISOString();
                    const endDate = endDateObj.toISOString();
                    const resp = await fetch(`/api/attendance?userId=${selectorEmployee}&startDate=${startDate}&endDate=${endDate}`, { headers: { Authorization: `Bearer ${token}` } });
                    const data = await resp.json();
                    if (data.success) {
                      setSelectorAttendance(data.attendances || []);
                      await fetchScheduleForUser(selectorEmployee, setSelectorEmployeeSchedule);
                      // open preview modal within selector (reuse existing preview area below)
                    } else {
                      setSelectorAttendance([]);
                      toast.error('No attendance records found for selected employee');
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error('Failed to fetch attendance');
                  } finally {
                    setSelectorLoading(false);
                  }
                }}
                className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm"
              >
                {selectorLoading ? 'Loading...' : 'Load & Preview'}
              </button>
            </div>

            {/* Preview area */}
            <div>
              {selectorAttendance.length > 0 ? (
                <>
                  <DtrPreview
                    attendanceRecords={selectorAttendance}
                    periodStart={selectorCutoff === '1-15' ? new Date(selectorMonth.getFullYear(), selectorMonth.getMonth(), 1) : new Date(selectorMonth.getFullYear(), selectorMonth.getMonth(), 16)}
                    periodEnd={selectorCutoff === '1-15' ? new Date(selectorMonth.getFullYear(), selectorMonth.getMonth(), 15) : new Date(selectorMonth.getFullYear(), selectorMonth.getMonth() + 1, 0)}
                    schedule={selectorEmployeeSchedule ? { lunchStart: selectorEmployeeSchedule.lunchStart, lunchEnd: selectorEmployeeSchedule.lunchEnd } : undefined}
                  />

                  <div className="mt-3 flex justify-end">
                      <DtrDownloadButton
                        employeeName={(employees.find(e => e._id === selectorEmployee)?.firstName ?? '') + ' ' + (employees.find(e => e._id === selectorEmployee)?.lastName ?? '')}
                        employeeId={selectorEmployee ?? undefined}
                      attendanceRecords={selectorAttendance}
                      periodStart={selectorCutoff === '1-15' ? new Date(selectorMonth.getFullYear(), selectorMonth.getMonth(), 1) : new Date(selectorMonth.getFullYear(), selectorMonth.getMonth(), 16)}
                      periodEnd={selectorCutoff === '1-15' ? new Date(selectorMonth.getFullYear(), selectorMonth.getMonth(), 15) : new Date(selectorMonth.getFullYear(), selectorMonth.getMonth() + 1, 0)}
                      filename={`DTR-${selectorEmployee}-${format(selectorMonth, 'yyyy-MM')}-${selectorCutoff}`}
                    />
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-gray-500">No preview loaded. Select employee and click "Load & Preview".</div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Break
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Late
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.userId ? `${record.userId.firstName ?? ''} ${record.userId.lastName ?? ''}`.trim() : 'Unknown user'}
                      </div>
                      <div className="text-sm text-gray-500">{record.userId?.employeeId ?? '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.timeIn ? format(parseISO(record.timeIn.timestamp), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.timeOut ? format(parseISO(record.timeOut.timestamp), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                      {(record.lunchBreakMinutes ?? 0) > 0 ? `-${record.lunchBreakMinutes ?? 0}min` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-semibold">
                      {record.workedHours ? `${record.workedHours.toFixed(2)} hrs` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-700 font-semibold">
                      {record.overtimeHours ? `${record.overtimeHours.toFixed(2)} hrs` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.isLate ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setModalOpen(true);
                        }}
                        className="p-2 rounded-md hover:bg-gray-100"
                        title="View capture"
                      >
                        <Eye className="w-5 h-5 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* View Modal (reusable component) */}
        <AttendanceCaptureModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          dateLabel={selectedRecord ? format(parseISO(selectedRecord.date), 'PP') : undefined}
          userName={selectedRecord ? `${selectedRecord.userId?.firstName ?? ''} ${selectedRecord.userId?.lastName ?? ''}`.trim() : undefined}
          timeIn={selectedRecord?.timeIn as any}
          timeOut={selectedRecord?.timeOut as any}
        />

        {/* Pagination */}
        {filteredRecords.length > 0 && (
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
    </div>
  );
}
