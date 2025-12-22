'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from '@/components/shared/Sidebar';
import { NotificationPanel } from '@/components/shared/NotificationPanel';

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const router = useRouter();
  const { user, token, isHydrated } = useAuthStore();

  React.useEffect(() => {
    // Wait for hydration before checking auth
    if (!isHydrated) return;

    if (!token || !user) {
      router.push('/auth/login');
      return;
    }
    if (user.role !== 'employee') {
      router.push('/admin/dashboard');
    }
  }, [token, user, router, isHydrated]);

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!token || !user || user.role !== 'employee') {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar role="employee" />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center justify-end px-4 lg:px-8">
          <NotificationPanel />
        </header>
        <main className="p-4 lg:p-8 bg-white">{children}</main>
      </div>
    </div>
  );
}
