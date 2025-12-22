'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from '@/components/shared/Sidebar';
import { NotificationPanel } from '@/components/shared/NotificationPanel';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, token, isHydrated } = useAuthStore();

  React.useEffect(() => {
    // Wait for hydration before checking auth
    if (!isHydrated) return;

    if (!token || !user) {
      router.push('/auth/login');
      return;
    }
    
    // Allow both admin and super-admin roles
    if (user.role !== 'admin' && user.role !== 'super-admin') {
      router.push('/employee/dashboard');
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

  // Don't render if not authenticated or wrong role
  if (!token || !user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar role={user.role as 'admin' | 'super-admin'} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-end px-4 lg:px-8" style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-text)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <NotificationPanel />
        </header>
        <main className="p-4 lg:p-8 bg-white">{children}</main>
      </div>
    </div>
  );
}

