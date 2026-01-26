/**
 * Centralized API Paths
 * All API endpoints defined in one place for easy maintenance
 * 
 * Change version once here, updates everywhere.
 * 
 * @see copilot-instructions.md - API Versioning Strategy
 */

import { API_CONFIG } from './config';

const V = API_CONFIG.CURRENT_VERSION;
const BASE = `${API_CONFIG.BASE_PATH}/${V}`;

/**
 * All API endpoint paths
 * Use these constants instead of hardcoding paths in hooks/components
 */
export const API_PATHS = {
  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  AUTH: {
    LOGIN: `${BASE}/auth/login`,
    REGISTER: `${BASE}/auth/register`,
    LOGOUT: `${BASE}/auth/logout`,
    FORGOT_PASSWORD: `${BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE}/auth/reset-password`,
  },

  // ============================================
  // USER ENDPOINTS
  // ============================================
  USERS: {
    BASE: `${BASE}/users`,
    BY_ID: (id: string) => `${BASE}/users/${id}`,
    PHOTO: (id: string) => `${BASE}/users/${id}/photo`,
  },

  // ============================================
  // ATTENDANCE ENDPOINTS
  // ============================================
  ATTENDANCE: {
    BASE: `${BASE}/attendance`,
    BY_ID: (id: string) => `${BASE}/attendance/${id}`,
  },

  // ============================================
  // SCHEDULE ENDPOINTS
  // ============================================
  SCHEDULES: {
    BASE: `${BASE}/schedules`,
    BY_ID: (id: string) => `${BASE}/schedules/${id}`,
  },

  // ============================================
  // TIME ENTRY ENDPOINTS
  // ============================================
  TIME_ENTRIES: {
    BASE: `${BASE}/time-entries`,
    BY_ID: (id: string) => `${BASE}/time-entries/${id}`,
  },

  // ============================================
  // LEAVE ENDPOINTS
  // ============================================
  LEAVES: {
    BASE: `${BASE}/leave`,
    BY_ID: (id: string) => `${BASE}/leave/${id}`,
  },

  // ============================================
  // TIME ADJUSTMENT ENDPOINTS
  // ============================================
  TIME_ADJUSTMENTS: {
    BASE: `${BASE}/time-adjustments`,
    BY_ID: (id: string) => `${BASE}/time-adjustments/${id}`,
  },

  // ============================================
  // AUDIT LOG ENDPOINTS
  // ============================================
  AUDIT_LOGS: {
    BASE: `${BASE}/audit-logs`,
  },

  // ============================================
  // NOTIFICATION ENDPOINTS
  // ============================================
  NOTIFICATIONS: {
    BASE: `${BASE}/notifications`,
    BY_ID: (id: string) => `${BASE}/notifications/${id}`,
    MARK_READ: (id: string) => `${BASE}/notifications/${id}/read`,
  },

  // ============================================
  // SYSTEM SETTINGS ENDPOINTS
  // ============================================
  SYSTEM_SETTINGS: {
    BASE: `${BASE}/system-settings`,
  },

  // ============================================
  // DASHBOARD ENDPOINTS
  // ============================================
  DASHBOARD: {
    BASE: `${BASE}/dashboard`,
    STATS: `${BASE}/dashboard/stats`,
  },

  // ============================================
  // ABSENCE ENDPOINTS
  // ============================================
  ABSENCE: {
    BASE: `${BASE}/absence`,
    BY_ID: (id: string) => `${BASE}/absence/${id}`,
  },

  // ============================================
  // UPLOAD ENDPOINTS
  // ============================================
  UPLOADS: {
    BASE: `${BASE}/uploads`,
  },
} as const;

/**
 * Legacy path mappings (for backward compatibility during migration)
 * Maps old unversioned paths to new versioned paths
 */
export const LEGACY_PATH_MAP: Record<string, string> = {
  '/api/users': API_PATHS.USERS.BASE,
  '/api/attendance': API_PATHS.ATTENDANCE.BASE,
  '/api/schedules': API_PATHS.SCHEDULES.BASE,
  '/api/time-entries': API_PATHS.TIME_ENTRIES.BASE,
  '/api/leave': API_PATHS.LEAVES.BASE,
  '/api/time-adjustments': API_PATHS.TIME_ADJUSTMENTS.BASE,
  '/api/audit-logs': API_PATHS.AUDIT_LOGS.BASE,
  '/api/notifications': API_PATHS.NOTIFICATIONS.BASE,
  '/api/system-settings': API_PATHS.SYSTEM_SETTINGS.BASE,
  '/api/dashboard': API_PATHS.DASHBOARD.BASE,
  '/api/absence': API_PATHS.ABSENCE.BASE,
  '/api/auth/login': API_PATHS.AUTH.LOGIN,
  '/api/auth/register': API_PATHS.AUTH.REGISTER,
  '/api/auth/forgot-password': API_PATHS.AUTH.FORGOT_PASSWORD,
  '/api/auth/reset-password': API_PATHS.AUTH.RESET_PASSWORD,
};
