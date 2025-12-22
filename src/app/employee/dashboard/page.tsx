'use client';

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/shared/StatCard';
import { TimeKeepingCard } from '@/components/employee/TimeKeepingCard';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

export default function EmployeeDashboard() {
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalHours: 0,
    daysPresent: 0,
    daysLate: 0,
  });

  useEffect(() => {
    // Wait for store to hydrate before checking auth
    if (!isHydrated) return;
    
    if (!isAuthenticated || user?.role !== 'employee') {
      router.push('/auth/login');
      return;
    }

    fetchStats();
  }, [isAuthenticated, user, router, isHydrated]);

  const fetchStats = async () => {
    try {
      // Get current month's attendance
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const response = await apiClient.getAttendance(user?._id, startDate, endDate);
      
      if (response.attendances) {
        const totalHours = response.attendances.reduce(
          (sum: number, a: any) => sum + (a.totalHours || 0),
          0
        );
        const daysPresent = response.attendances.filter(
          (a: any) => a.status === 'present'
        ).length;
        const daysLate = response.attendances.filter((a: any) => a.isLate).length;

        setStats({ totalHours, daysPresent, daysLate });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'employee') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Track your time and view your attendance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Clock}
          title="Total Hours (This Month)"
          value={stats.totalHours.toFixed(1)}
          subtitle="hours worked"
          color="blue"
        />
        <StatCard
          icon={Calendar}
          title="Days Present"
          value={stats.daysPresent}
          subtitle="this month"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="Days Late"
          value={stats.daysLate}
          subtitle="this month"
          color={stats.daysLate > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Time Keeping Card */}
      <TimeKeepingCard />
    </div>
  );
}

