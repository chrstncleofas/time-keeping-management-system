'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Calendar, Clock, TrendingUp, Download } from 'lucide-react';
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
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(selectedMonth).toISOString();
      const endDate = endOfMonth(selectedMonth).toISOString();

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
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Download className="w-5 h-5" />
          <span>Export</span>
        </button>
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

      {/* Month Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Select Month:</label>
          <input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

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
