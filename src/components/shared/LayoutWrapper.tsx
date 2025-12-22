'use client';

import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
  role: 'admin' | 'employee' | 'super-admin';
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children, role }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};
