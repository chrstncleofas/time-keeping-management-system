'use client';

import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  FileText,
  Activity,
  XCircle,
  Settings,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/shared/StatCard';

export default function AdminDashboard() {
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });
  const [systemStats, setSystemStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState({
    leaves: 0,
    timeAdjustments: 0,
  });
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.role === 'super-admin';

  useEffect(() => {
    // Wait for store to hydrate before checking auth
    if (!isHydrated) return;
    
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super-admin')) {
      router.push('/auth/login');
      return;
    }

    fetchStats();
    if (isSuperAdmin) {
      fetchSystemStats();
      fetchRecentActivity();
      fetchPendingRequests();
    }
  }, [isAuthenticated, user, router, isHydrated]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.getDashboardStats();
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const settings = await apiClient.getSystemSettings();
      setSystemStats(settings);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/audit-logs?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setRecentLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = useAuthStore.getState().token;
      const [leavesRes, adjustmentsRes] = await Promise.all([
        fetch('/api/leave', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/time-adjustments', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      const leavesData = await leavesRes.json();
      const adjustmentsData = await adjustmentsRes.json();
      
      setPendingRequests({
        leaves: leavesData.leaves?.filter((l: any) => l.status === 'pending').length || 0,
        timeAdjustments: adjustmentsData.adjustments?.filter((a: any) => a.status === 'pending').length || 0,
      });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super-admin')) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isSuperAdmin 
            ? 'System-wide overview and management' 
            : 'Overview of your time keeping system'}
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Employees"
          value={stats.totalEmployees}
          color="blue"
        />
        <StatCard
          icon={UserCheck}
          title="Present Today"
          value={stats.presentToday}
          subtitle={stats.totalEmployees > 0 ? `${((stats.presentToday / stats.totalEmployees) * 100).toFixed(0)}% attendance` : 'NaN% attendance'}
          color="green"
        />
        <StatCard
          icon={UserX}
          title="Absent Today"
          value={stats.absentToday}
          color="red"
        />
        <StatCard
          icon={Clock}
          title="Late Today"
          value={stats.lateToday}
          color="yellow"
        />
      </div>

      {/* Super Admin Extra Stats */}
      {isSuperAdmin && (
        <>
          {/* System Status & Pending Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Features Status */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Features</h3>
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Leave Management</span>
                  {systemStats?.enableFileLeaveRequest ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Time Adjustments</span>
                  {systemStats?.enableVerbalAgreements ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Leave Credits Mgmt</span>
                  {systemStats?.enableLeaveCreditsManagement ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/settings')}
                className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Manage Settings
              </button>
            </div>

            {/* Pending Requests */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm p-6 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="space-y-4">
                <div 
                  onClick={() => router.push('/admin/leaves')}
                  className="cursor-pointer p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Leave Requests</span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">{pendingRequests.leaves}</span>
                  </div>
                </div>
                <div 
                  onClick={() => router.push('/admin/time-adjustments')}
                  className="cursor-pointer p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Time Adjustments</span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">{pendingRequests.timeAdjustments}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm p-6 border border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log: any) => (
                    <div key={log._id} className="p-2 bg-white rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-2 h-2 rounded-full ${
                          log.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{log.userName}</p>
                          <p className="text-xs text-gray-600 truncate">{log.action}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
              <button
                onClick={() => router.push('/admin/audit-logs')}
                className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                View All Logs
              </button>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/admin/employees')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
          >
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Manage Employees</p>
            <p className="text-sm text-gray-600">Add or edit employees</p>
          </button>
          
          <button
            onClick={() => router.push('/admin/schedules')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
          >
            <Clock className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Set Schedules</p>
            <p className="text-sm text-gray-600">Configure work schedules</p>
          </button>
          
          <button
            onClick={() => router.push('/admin/attendance')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
          >
            <UserCheck className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">View Attendance</p>
            <p className="text-sm text-gray-600">Check attendance records</p>
          </button>
          
          <button
            onClick={() => router.push('/admin/employees?action=add')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors"
          >
            <Users className="w-6 h-6 text-orange-600 mb-2" />
            <p className="font-medium text-gray-900">Add Employee</p>
            <p className="text-sm text-gray-600">Register new employee</p>
          </button>
        </div>
      </div>
    </div>
  );
}

