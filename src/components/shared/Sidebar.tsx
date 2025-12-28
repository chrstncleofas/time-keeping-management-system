'use client';

import { 
  X,
  Users, 
  Clock,
  User,
  LogOut,
  Menu,
  Calendar, 
  Settings,
  FileText,
  ClockIcon,
  LucideIcon,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/lib/toast';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  requiresSetting?: string;
}

interface SidebarProps {
  role: 'admin' | 'employee' | 'super-admin';
}

const adminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Employees', href: '/admin/employees' },
  { icon: FileText, label: 'Leave Requests', href: '/admin/leaves', requiresSetting: 'enableFileLeaveRequest' },
  { icon: Calendar, label: 'Attendance', href: '/admin/attendance' },
  { icon: Clock, label: 'Schedules', href: '/admin/schedules' },
  { icon: ClockIcon, label: 'Time Adjustments', href: '/admin/time-adjustments', requiresSetting: 'enableVerbalAgreements' },
  { icon: ShieldCheck, label: 'Logs', href: '/admin/audit-logs' },
];

const superAdminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Users, label: 'Employees', href: '/admin/employees' },
  { icon: FileText, label: 'Leave Requests', href: '/admin/leaves', requiresSetting: 'enableFileLeaveRequest' },
  { icon: Calendar, label: 'Attendance', href: '/admin/attendance' },
  { icon: Clock, label: 'Schedules', href: '/admin/schedules' },
  { icon: ClockIcon, label: 'Time Adjustments', href: '/admin/time-adjustments', requiresSetting: 'enableVerbalAgreements' },
  { icon: ShieldCheck, label: 'Logs', href: '/admin/audit-logs' },
  { icon: Settings, label: 'System Settings', href: '/admin/settings' },
];

const employeeMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/employee/dashboard' },
  { icon: Calendar, label: 'My Attendance', href: '/employee/attendance' },
  { icon: FileText, label: 'Leave Requests', href: '/employee/leaves', requiresSetting: 'enableFileLeaveRequest' },
  { icon: Clock, label: 'My Schedule', href: '/employee/schedule' },
  { icon: User, label: 'Profile', href: '/employee/profile' },
];

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const response = await apiClient.getSystemSettings();
      setSystemSettings(response);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      // If error, assume all features are enabled (fail-safe)
      setSystemSettings({
        enableFileLeaveRequest: true,
        enableVerbalAgreements: true,
        enableLeaveCreditsManagement: true,
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const safeGet = (varName: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(varName);
      return (v || '').trim() || fallback;
    } catch (e) {
      return fallback;
    }
  };

  const menuItems = 
    role === 'super-admin' ? superAdminMenuItems :
    role === 'admin' ? adminMenuItems : 
    employeeMenuItems;

  // Filter menu items based on system settings
  const filteredMenuItems = menuItems.filter(item => {
    // If no setting required, always show
    if (!item.requiresSetting) return true;
    
    // If settings not loaded yet, hide conditional items temporarily
    if (isLoadingSettings || !systemSettings) return false;
    
    // Check if the required setting is enabled
    return systemSettings[item.requiresSetting] === true;
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/auth/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center h-24 px-6 border-b" style={{ borderColor: systemSettings?.sidebarHoverBg || 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-center">
          <Image
            src={systemSettings?.logoUrl || process.env.NEXT_PUBLIC_APP_LOGO || '/ibaytech-logo.png'}
            alt={systemSettings?.companyName || process.env.NEXT_PUBLIC_APP_NAME || 'IBAYTECH'}
            width={120}
            height={120}
            priority
            style={{ width: 'auto', height: 'auto', maxWidth: '120px' }}
            className="drop-shadow-2xl"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <span className="font-semibold text-lg" style={{ color: 'var(--sidebar-active-bg)' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: systemSettings?.sidebarText || safeGet('--sidebar-text', '#e6eef8') }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs truncate" style={{ color: systemSettings?.sidebarText || safeGet('--sidebar-text', '#e6eef8') }}>
              {role === 'super-admin' ? 'Super Admin' : role === 'admin' ? 'Administrator' : user?.employeeId}
            </p>
          </div>
        </div>
        {role === 'employee' && user?.leaveCredits != null && (systemSettings?.enableLeaveCreditsManagement ?? true) && (
          <div className="mt-3 px-3 py-2 bg-dark-700 rounded-lg border border-dark-600">
            <p className="text-xs text-gray-400">Leave Credits</p>
            <p className="text-lg font-semibold text-primary-500">
              {user.leaveCredits} days
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-dark">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          const isHovered = hoveredItem === item.href;
          const style = isActive
            ? { backgroundColor: systemSettings?.sidebarActiveBg || safeGet('--sidebar-active-bg', '#2563eb'), color: '#fff' }
            : isHovered
            ? { backgroundColor: systemSettings?.sidebarHoverBg || safeGet('--sidebar-hover-bg', '#0b1220'), color: systemSettings?.sidebarText || safeGet('--sidebar-text', '#e6eef8') }
            : { color: systemSettings?.sidebarText || safeGet('--sidebar-text', '#e6eef8') };

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { setIsMobileMenuOpen(false); setHoveredItem(null); }}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors pointer-events-auto ${isActive ? 'font-medium shadow-lg' : ''}`}
                  style={style}
            >
                  <Icon className="w-5 h-5" style={isActive ? { color: '#fff' } : { color: systemSettings?.primaryColor || safeGet('--primary-color', '#2563eb') }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg transition-colors"
          style={{ backgroundColor: 'transparent', color: systemSettings?.sidebarText || safeGet('--sidebar-text', '#e6eef8') }}
        >
          <LogOut className="w-5 h-5" style={{ color: systemSettings?.sidebarText || safeGet('--sidebar-text', '#e6eef8') }} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 lg:hidden transition-opacity duration-200"
          onClick={toggleMobileMenu}
          aria-hidden
          style={{ zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 shadow-2xl transform transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          zIndex: 100,
          backgroundColor: systemSettings?.sidebarBg || safeGet('--sidebar-bg', '#0f1724'),
          color: systemSettings?.sidebarText || safeGet('--sidebar-text', '#e6eef8'),
          borderRight: '1px solid rgba(255,255,255,0.04)'
        }}
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="fixed left-4 lg:hidden p-1.5 rounded-md"
        style={{
          top: `calc(var(--safe-area-inset-top, 0px) + 12px)`,
          zIndex: 110,
          backgroundColor: systemSettings?.sidebarBg || safeGet('--sidebar-bg', '#0f1724'),
          border: '1px solid rgba(255,255,255,0.04)',
          color: systemSettings?.sidebarText || safeGet('--sidebar-text', '#e6eef8'),
        }}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        title={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>
    </>
  );
};
