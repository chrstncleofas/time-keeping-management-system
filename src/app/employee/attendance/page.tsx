'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Calendar, Clock, TrendingUp, Download } from 'lucide-react';
import DtrDownloadButton from '@/components/shared/DtrDownloadButton';
import DtrPreview from '@/components/shared/DtrPreview';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/lib/toast';

interface AttendanceRecord {
  _id: string;
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
  isLate: boolean;
  isEarlyOut: boolean;
  status: 'present' | 'absent' | 'on-leave' | 'holiday';
}

export default function EmployeeAttendancePage() {
  const { user, token } = useAuthStore();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSchedule, setActiveSchedule] = useState<any | null>(null);
  const [isDtrModalOpen, setDtrModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [cutoff, setCutoff] = useState<'1-15' | '16-end'>(() => {
    const today = new Date();
    const isCurrentMonth = selectedMonth.getFullYear() === today.getFullYear() && selectedMonth.getMonth() === today.getMonth();
    return isCurrentMonth && today.getDate() > 15 ? '16-end' : '1-15';
  });

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth, cutoff]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      // determine cut-off range for API query
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      const startDateObj = cutoff === '1-15' ? new Date(year, month, 1) : new Date(year, month, 16);
      const endDateObj = cutoff === '1-15' ? new Date(year, month, 15) : endOfMonth(selectedMonth);
      const startDate = startDateObj.toISOString();
      const endDate = endDateObj.toISOString();

      const response = await fetch(
        `/api/attendance?userId=${user?._id}&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAttendanceRecords(data.attendances);
        // fetch active schedule for user to derive lunch times for DTR preview
        try {
          const schedRes = await apiClient.getSchedules(user?._id);
          if (schedRes && Array.isArray(schedRes.schedules) && schedRes.schedules.length > 0) {
            // pick most recently updated active schedule
            const active = schedRes.schedules.find((s: any) => s.isActive) || schedRes.schedules[0];
            setActiveSchedule(active);
          } else {
            setActiveSchedule(null);
          }
        } catch (err) {
          setActiveSchedule(null);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalPresent: attendanceRecords.filter(r => r.status === 'present').length,
    totalHours: attendanceRecords.reduce((sum, r) => sum + (r.totalHours ?? 0), 0),
    totalLate: attendanceRecords.filter(r => r.isLate).length,
    onLeave: attendanceRecords.filter(r => r.status === 'on-leave').length,
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      'on-leave': 'bg-yellow-100 text-yellow-800',
      holiday: 'bg-blue-100 text-blue-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time In', 'Time Out', 'Total Hours', 'Status', 'Late'];
    const rows = attendanceRecords.map(record => [
      format(parseISO(record.date), 'yyyy-MM-dd'),
      record.timeIn ? format(parseISO(record.timeIn.timestamp), 'HH:mm') : '-',
      record.timeOut ? format(parseISO(record.timeOut.timestamp), 'HH:mm') : '-',
      (record.totalHours ?? 0).toFixed(2),
      record.status,
      record.isLate ? 'Yes' : 'No',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-attendance-${format(selectedMonth, 'yyyy-MM')}.csv`;
    a.click();
    toast.success('Attendance exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600 mt-1">Track your attendance records</p>
            <button
              onClick={() => setDtrModalOpen(true)}
              className="mt-4 flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 focus:outline-none"
            >
              <Download className="w-4 h-4 mt" />
              <span className="text-sm font-medium">Download DTR</span>
            </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Days Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalPresent}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalHours.toFixed(1)}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Times Late</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.totalLate}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-purple-600">{stats.onLeave}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Month/Cutoff now in modal to avoid duplicate preview UI */}

      {/* Inline preview removed — use modal preview instead */}

      {/* DTR Modal */}
      {isDtrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDtrModalOpen(false)} aria-hidden />
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-lg shadow-lg p-3 sm:p-4 overflow-auto">
            <div className="flex items-start justify-between mb-2 gap-3">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold">Preview DTR</h3>
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
                  employeeName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                  employeeId={user?._id}
                  attendanceRecords={attendanceRecords}
                  periodStart={cutoff === '1-15' ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1) : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 16)}
                  periodEnd={cutoff === '1-15' ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 15) : endOfMonth(selectedMonth)}
                  filename={`DTR-${format(selectedMonth, 'yyyy-MM')}-${cutoff}`}
                />
              </div>
            </div>

            <div className="mb-4">
              <DtrPreview
                attendanceRecords={attendanceRecords}
                periodStart={cutoff === '1-15' ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1) : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 16)}
                periodEnd={cutoff === '1-15' ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 15) : endOfMonth(selectedMonth)}
                schedule={activeSchedule ? { lunchStart: activeSchedule.lunchStart, lunchEnd: activeSchedule.lunchEnd } : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Late
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No attendance records found for this month
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(parseISO(record.date), 'MMM dd, yyyy - EEEE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.timeIn ? (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-green-600" />
                          {format(parseISO(record.timeIn.timestamp), 'hh:mm a')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.timeOut ? (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-red-600" />
                          {format(parseISO(record.timeOut.timestamp), 'hh:mm a')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      {(record.lunchBreakMinutes ?? 0) > 0 ? `-${(record.lunchBreakMinutes ?? 0)}min` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                      {record.workedHours ? `${record.workedHours.toFixed(2)} hrs` : '-'}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Card */}
      {!loading && attendanceRecords.length > 0 && (
        <div className="bg-gradient-to-r from-primary-600 to-accent-500 text-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Monthly Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-white/80 text-sm">Working Days</p>
              <p className="text-2xl font-bold">{stats.totalPresent}</p>
            </div>
            <div>
              <p className="text-white/80 text-sm">Total Hours</p>
              <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-white/80 text-sm">Average Hours/Day</p>
              <p className="text-2xl font-bold">
                {stats.totalPresent > 0 ? (stats.totalHours / stats.totalPresent).toFixed(1) : '0'}
              </p>
            </div>
            <div>
              <p className="text-white/80 text-sm">On-Time Rate</p>
              <p className="text-2xl font-bold">
                {stats.totalPresent > 0 
                  ? ((stats.totalPresent - stats.totalLate) / stats.totalPresent * 100).toFixed(0)
                  : '0'}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
