'use client';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  addMonths,
  subMonths
} from 'date-fns';

import { toast } from '@/lib/toast';
import { ISchedule, DayOfWeek } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS_FULL: { [key in DayOfWeek]: string } = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

interface AttendanceRecord {
  _id: string;
  date: string;
  timeIn?: {
    timestamp: string;
  };
  timeOut?: {
    timestamp: string;
  };
  status: 'present' | 'absent' | 'on-leave' | 'holiday';
  isLate: boolean;
  totalHours?: number;
  lunchBreakMinutes?: number;
  workedHours?: number;
}

export default function EmployeeSchedulePage() {
  const { user, token } = useAuthStore();
  const [schedule, setSchedule] = useState<ISchedule | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchSchedule();
    fetchAttendance();
  }, [currentMonth, user]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schedule?userId=${user?._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.schedules.length > 0) {
        setSchedule(data.schedules[0]);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const startDate = startOfMonth(currentMonth).toISOString();
      const endDate = endOfMonth(currentMonth).toISOString();

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
    }
  };

  const getTodaySchedule = () => {
    if (!schedule) return null;
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as DayOfWeek;
    return schedule.days.includes(today);
  };

  const calculateWorkHours = () => {
    if (!schedule) return 0;
    
    const [inHours, inMinutes] = schedule.timeIn.split(':').map(Number);
    const [outHours, outMinutes] = schedule.timeOut.split(':').map(Number);
    
    const totalInMinutes = inHours * 60 + inMinutes;
    const totalOutMinutes = outHours * 60 + outMinutes;
    
    let totalMinutes = totalOutMinutes - totalInMinutes;
    if (totalMinutes < 0) totalMinutes = 0;

    // compute lunch deduction
    let lunchMinutes = 0;
    if (schedule.lunchStart && schedule.lunchEnd) {
      const [lsH, lsM] = schedule.lunchStart.split(':').map(Number);
      const [leH, leM] = schedule.lunchEnd.split(':').map(Number);
      const lunchStartMin = lsH * 60 + lsM;
      const lunchEndMin = leH * 60 + leM;
      const overlapStart = Math.max(totalInMinutes, lunchStartMin);
      const overlapEnd = Math.min(totalOutMinutes, lunchEndMin);
      lunchMinutes = Math.max(0, overlapEnd - overlapStart);
    } else {
      // DOLE fallback
      const totalHours = totalMinutes / 60;
      if (totalHours > 6) lunchMinutes = 60;
      else if (totalHours >= 4) lunchMinutes = 30;
    }

    const workedHours = Math.max(0, (totalMinutes - lunchMinutes) / 60);
    return workedHours.toFixed(1);
  };

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getAttendanceForDate = (date: Date) => {
    return attendanceRecords.find(record => 
      isSameDay(parseISO(record.date), date)
    );
  };

  const isWorkDay = (date: Date) => {
    if (!schedule) return false;
    const dayName = format(date, 'EEEE').toLowerCase() as DayOfWeek;
    return schedule.days.includes(dayName);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const attendance = getAttendanceForDate(cloneDay);
        const isWorkday = isWorkDay(cloneDay);
        const isCurrentMonth = isSameMonth(cloneDay, monthStart);
        const isToday = isSameDay(cloneDay, new Date());

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] border border-gray-200 p-2 ${
              !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
            } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-sm font-medium ${
                !isCurrentMonth ? 'text-gray-400' : isToday ? 'text-primary-600 font-bold' : 'text-gray-900'
              }`}>
                {format(cloneDay, 'd')}
              </span>
              {isWorkday && isCurrentMonth && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                  Work
                </span>
              )}
            </div>

            {isCurrentMonth && attendance && (
              <div className="space-y-1">
                {attendance.status === 'present' && attendance.timeIn ? (
                  <>
                    <div className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                      <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span>In: {format(parseISO(attendance.timeIn.timestamp), 'h:mm a')}</span>
                    </div>
                    {attendance.timeOut && (
                      <div className="flex items-center text-xs font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                        <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span>Out: {format(parseISO(attendance.timeOut.timestamp), 'h:mm a')}</span>
                      </div>
                    )}
                    {attendance.isLate && (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded block">
                        Late
                      </span>
                    )}
                  </>
                ) : attendance.status === 'absent' && isWorkday ? (
                  <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded block">
                    Absent
                  </span>
                ) : attendance.status === 'on-leave' ? (
                  <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded block">
                    On Leave
                  </span>
                ) : attendance.status === 'holiday' ? (
                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded block">
                    Holiday
                  </span>
                ) : null}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-600 mt-1">View your work schedule</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Schedule Assigned</h3>
          <p className="text-gray-600 mb-6">
            You don't have a work schedule yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const isWorkingToday = getTodaySchedule();
  const workHours = calculateWorkHours();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-600 mt-1">Calendar view of your work schedule and attendance</p>
        </div>
      </div>

      {/* Today's Status */}
      <div className={`p-6 rounded-xl shadow-sm ${
        isWorkingToday 
          ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white' 
          : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${isWorkingToday ? 'text-white/80' : 'text-gray-600'}`}>
              Today's Status
            </p>
            <p className="text-2xl font-bold mt-1">
              {isWorkingToday ? 'Work Day' : 'Rest Day'}
            </p>
          </div>
          <Calendar className={`w-12 h-12 ${isWorkingToday ? 'text-white' : 'text-gray-400'}`} />
        </div>
        {isWorkingToday && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-medium">{formatTime12Hour(schedule.timeIn)}</span>
              </div>
              <span>→</span>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-medium">{formatTime12Hour(schedule.timeOut)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Header */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-700 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {renderCalendar()}
      </div>

      {/* Legend */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-700">Time In</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm text-gray-700">Time Out / Absent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-sm text-gray-700">Late / On Leave</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-sm text-gray-700">Work Day</span>
          </div>
        </div>
      </div>

      {/* Work Schedule Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <Clock className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Time In</p>
              <p className="text-xl font-bold text-gray-900">{formatTime12Hour(schedule.timeIn)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <Clock className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Time Out</p>
              <p className="text-xl font-bold text-gray-900">{formatTime12Hour(schedule.timeOut)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <Clock className="w-6 h-6 text-primary-600" />
            <div>
              <p className="text-sm text-gray-600">Daily Hours</p>
              <p className="text-xl font-bold text-gray-900">{workHours} hrs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Working Days */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Days</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DAYS_FULL).map(([key, label]) => {
            const isWorking = schedule.days.includes(key as DayOfWeek);
            return (
              <span
                key={key}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isWorking 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
