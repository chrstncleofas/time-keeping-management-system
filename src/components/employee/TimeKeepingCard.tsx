'use client';

import { toast } from '@/lib/toast';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import React, { useState, useEffect } from 'react';
import { WebcamCapture } from '@/components/shared/WebcamCapture';
import { Camera, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatTime, getCurrentDayOfWeek, getPhilippineTime } from '@/lib/utils/helpers';

// Helper function to convert 24-hour format to 12-hour format with AM/PM
const formatTime12Hour = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; 
  return `${hour12}:${minutes} ${ampm}`;
};

export const TimeKeepingCard: React.FC = () => {
  const { user } = useAuthStore();
  const [showCamera, setShowCamera] = useState(false);
  const [clockType, setClockType] = useState<'time-in' | 'time-out'>('time-in');
  const [loading, setLoading] = useState(false);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(getPhilippineTime());
  const [schedule, setSchedule] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getPhilippineTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayStatus();
    fetchSchedule();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const startDate = `${year}-${month}-${day}`;
      const endDate = `${year}-${month}-${day}`;
      const response = await apiClient.getAttendance(user?._id, startDate, endDate); 
      if (response.success && response.attendances && response.attendances.length > 0) {
        setTodayStatus(response.attendances[0]);
      } else {
        setTodayStatus(null);
      }
    } catch (error) {
      setTodayStatus(null);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await apiClient.getSchedules(user?._id);
      if (response.schedules && response.schedules.length > 0) {
        const currentDay = getCurrentDayOfWeek();
        const activeSchedule = response.schedules.find((s: any) => 
          s.days.includes(currentDay) && s.isActive
        );
        setSchedule(activeSchedule);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const handleOpenCamera = (type: 'time-in' | 'time-out') => {
    setClockType(type);
    // Show confirmation modal for clock out
    if (type === 'time-out') {
      setShowConfirmModal(true);
    } else {
      setShowCamera(true);
    }
  };

  const handleConfirmClockOut = () => {
    setShowConfirmModal(false);
    setShowCamera(true);
  };

  const handlePhotoCapture = async (photoBase64: string) => {
    setLoading(true);
    setShowCamera(false);

    try {
      const response = clockType === 'time-in'
        ? await apiClient.clockIn(photoBase64)
        : await apiClient.clockOut(photoBase64);
        
      toast.success(
        clockType === 'time-in' 
          ? 'Successfully clocked in!' 
          : 'Successfully clocked out!'
      );

      // Update status immediately from response if available
      if (response.attendance) {
        setTodayStatus(response.attendance);
      } else if (response.timeEntry) {
        // Fallback: create a partial status from timeEntry
        const newStatus = {
          ...todayStatus,
          timeIn: clockType === 'time-in' ? response.timeEntry : todayStatus?.timeIn,
          timeOut: clockType === 'time-out' ? response.timeEntry : todayStatus?.timeOut
        };
        setTodayStatus(newStatus);
      }

      // Refresh today's status from API
      setTimeout(() => {
        fetchTodayStatus();
      }, 500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const hasTimedIn = todayStatus?.timeIn;
  const hasTimedOut = todayStatus?.timeOut;
  const canTimeIn = !hasTimedIn && schedule;
  // Clock out enabled if timed in and not yet timed out
  const canTimeOut = Boolean(todayStatus?.timeIn) && !Boolean(todayStatus?.timeOut);
  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
        {/* Current Time Display */}
        <div className="text-center mb-8">
          <div className="text-5xl lg:text-6xl font-bold text-gray-900 mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-lg text-gray-600">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Schedule Info */}
        {schedule && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-3">Today's Schedule</p>
            {schedule.lunchStart && schedule.lunchEnd ? (
              // Split shift with lunch break
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <span className="font-semibold">{formatTime12Hour(schedule.timeIn)}</span>
                  <span>-</span>
                  <span className="font-semibold">{formatTime12Hour(schedule.lunchStart)}</span>
                  <span className="text-xs text-blue-600">(Morning)</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-orange-600">
                  <span className="text-xs">🍽️ Lunch Break:</span>
                  <span className="font-medium">{formatTime12Hour(schedule.lunchStart)}</span>
                  <span>-</span>
                  <span className="font-medium">{formatTime12Hour(schedule.lunchEnd)}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <span className="font-semibold">{formatTime12Hour(schedule.lunchEnd)}</span>
                  <span>-</span>
                  <span className="font-semibold">{formatTime12Hour(schedule.timeOut)}</span>
                  <span className="text-xs text-blue-600">(Afternoon)</span>
                </div>
              </div>
            ) : (
              // Regular shift without explicit lunch break
              <div className="flex items-center justify-center gap-4 text-blue-700">
                <span className="font-semibold">{formatTime12Hour(schedule.timeIn)}</span>
                <span>-</span>
                <span className="font-semibold">{formatTime12Hour(schedule.timeOut)}</span>
              </div>
            )}
          </div>
        )}

        {/* Status Display */}
        {todayStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {hasTimedIn && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Time In</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatTime(todayStatus.timeIn.timestamp)}
                </p>
                {todayStatus.isLate && (
                  <p className="text-sm text-red-600 mt-1">Late</p>
                )}
              </div>
            )}

            {hasTimedOut && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Time Out</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatTime(todayStatus.timeOut.timestamp)}
                </p>
                {todayStatus.isEarlyOut && (
                  <p className="text-sm text-yellow-600 mt-1">Early Out</p>
                )}
              </div>
            )}
            
            {/* Worked Hours Summary - Only show after time out */}
            {hasTimedIn && hasTimedOut && todayStatus.workedHours !== undefined && (
              <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-900 mb-1">Total Work Duration</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {todayStatus.totalHours?.toFixed(2)} hrs
                    </p>
                  </div>
                  {todayStatus.lunchBreakMinutes > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-purple-900 mb-1">Lunch Break</p>
                      <p className="text-2xl font-bold text-purple-600">
                        -{todayStatus.lunchBreakMinutes} mins
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-sm font-medium text-indigo-900 mb-1">Worked Hours</p>
                    <p className="text-3xl font-bold text-indigo-700">
                      {todayStatus.workedHours?.toFixed(2)} hrs
                    </p>
                  </div>
                </div>
                {todayStatus.lunchBreakMinutes > 0 && (
                  <p className="text-xs text-purple-600 mt-2">
                    * DOLE compliant: Automatic lunch break deduction applied
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleOpenCamera('time-in')}
            disabled={!canTimeIn || loading}
            className={`py-4 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              canTimeIn && !loading
                ? 'bg-green-600 hover:bg-green-700 active:scale-95'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <Camera className="w-5 h-5" />
            {loading && clockType === 'time-in' ? 'Processing...' : 'Clock In'}
          </button>

          <button
            onClick={() => handleOpenCamera('time-out')}
            disabled={!canTimeOut || loading}
            className={`py-4 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              canTimeOut && !loading
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <Camera className="w-5 h-5" />
            {loading && clockType === 'time-out' ? 'Processing...' : 'Clock Out'}
          </button>
        </div>

        {!schedule && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              No schedule assigned for today. Please contact your administrator.
            </p>
          </div>
        )}
      </div>

      {showCamera && (
        <WebcamCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Clock Out Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Clock Out</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                Are you sure you want to clock out now?
              </p>
              
              {schedule && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-900 mb-1">Scheduled Time Out:</p>
                  <p className="text-lg font-semibold text-blue-700">
                    {formatTime12Hour(schedule.timeOut)}
                  </p>
                </div>
              )}
              
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm text-yellow-900 mb-1">Current Time:</p>
                <p className="text-lg font-semibold text-yellow-700">
                  {formatTime(currentTime)}
                </p>
              </div>

              <p className="text-sm text-gray-600">
                Note: If you clock out before your scheduled time, it will be marked as early out.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClockOut}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
