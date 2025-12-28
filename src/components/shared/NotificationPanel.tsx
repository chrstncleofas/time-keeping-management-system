'use client';

import { 
  useNotifications,
  useMarkAllNotifications
} from '@/lib/hooks/useNotifications';

import { Bell, X } from 'lucide-react';
import React, { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  avatar?: string;
  images?: string[];
  read: boolean;
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { data, refetch } = useNotifications();
  const notifications = (data ?? []) as Notification[];
  const markAllMutation = useMarkAllNotifications();

  // when opening panel, ensure notifications are fresh
  const handleToggleOpen = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    if (newOpen) refetch?.();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    // trigger server-side update via mutation and refresh list on success
    markAllMutation.mutate(undefined, {
      onSuccess: () => refetch?.(),
      onError: (err) => console.error('mark all read failed', err),
    });
  };

  return (
    <>
      {/* Bell Icon Button */}
      <button
        onClick={handleToggleOpen}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 max-w-[95vw] bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <div className="px-6 py-3 border-b border-gray-200">
                <button
                  onClick={() => markAllMutation.mutate()}
                  className="text-sm font-medium"
                  style={{ color: 'var(--primary-color)' }}
                >
                  Mark all as read
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Bell className="w-12 h-12 mb-2" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification: Notification, _idx: number) => (
                    <div
                      key={notification.id ?? `notification-${_idx}`}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))' }}>
                            {notification.title?.charAt(0) ?? 'N'}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.description}
                          </p>

                          <p className="text-xs text-gray-400">{notification.date}</p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
