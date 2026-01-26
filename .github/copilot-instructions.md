# Copilot Instructions - TKMS (Time Keeping Management System)

> **Project**: Time Keeping Management System  
> **Created At**: December 2024

> **Updated At**: September 2025
> **Language**: TypeScript 5.3 (strict mode)
> **Framework**: Next.js 14 (App Router)

---

## 🎯 Core Principles

### Code Quality Standards

**ALWAYS prioritize:**
1. **Clean Code** - Write code that is simple, readable, and self-explanatory
2. **Maintainability** - Code should be easy to modify, extend, and debug
3. **Readability** - Code should be self-documenting with meaningful names
4. **DRY (Don't Repeat Yourself)** - Extract reusable logic into hooks/utils/services
5. **Clean Structure** - Follow established folder conventions
6. **Type Safety** - **NEVER use `any`**, always use proper types from `@/types` or `unknown`
7. **No Emojis in Code** - NEVER use emojis in code, comments, console logs, or string literals

### No Emojis Policy

```typescript
// BAD: Emojis in code
console.log("✅ Success!");
console.log("❌ Error occurred");
const message = "🎉 Attendance recorded!";

// GOOD: Plain text only
console.log("Success!");
console.log("Error occurred");
const message = "Attendance recorded!";
```

### 🚨 STRICT: No `any` Types Policy

```typescript
// ABSOLUTELY FORBIDDEN - Never use `any`
const data: any = response.data;
function process(input: any) { }
} catch (error: any) { }
const items: any[] = [];

// CORRECT - Use proper types or `unknown`
const data: IAttendance = response.data;
function process(input: unknown) { }
} catch (error: unknown) {
  const err = error as Error;
  console.error(err.message);
}
const items: ITimeEntry[] = [];
```

**Why no `any`?**
- `any` disables TypeScript's type checking completely
- It hides bugs that would be caught at compile time
- It makes code harder to maintain and refactor
- It defeats the purpose of using TypeScript

### Clean Code Principles

```typescript
// BAD: Unclear, nested, hard to read
const x = data.filter((d: any) => d.s === 'present').map((d: any) => ({ ...d, t: d.h * 60 }));

// GOOD: Clear, readable, self-documenting
const presentAttendances = attendances.filter(
  (attendance: IAttendance) => attendance.status === 'present'
);
const attendancesWithMinutes = presentAttendances.map((attendance: IAttendance) => ({
  ...attendance,
  totalMinutes: (attendance.totalHours || 0) * 60,
}));
```

**Clean Code Rules:**
1. **Meaningful Names** - Variables/functions should describe their purpose
2. **Small Functions** - Each function does ONE thing well
3. **No Magic Numbers** - Use constants with descriptive names
4. **Early Returns** - Reduce nesting with guard clauses
5. **Single Responsibility** - Each file/component has one purpose
6. **Comments for WHY** - Code shows what, comments explain why

---

## 📁 Project Structure

```
tkms/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD pipeline
├── docs/                       # Project documentation
├── logs/                       # Winston log files (daily rotate)
├── public/
│   └── uploads/                # User uploaded files
├── scripts/
│   ├── seed.js                 # Database seeding
│   ├── convert-timestamps.js   # Utility scripts
│   └── *.js                    # Other maintenance scripts
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Landing page
│   │   ├── Providers.tsx       # React Query provider
│   │   ├── admin/              # Admin dashboard routes
│   │   │   ├── layout.tsx      # Admin layout with sidebar
│   │   │   ├── dashboard/
│   │   │   ├── employees/
│   │   │   ├── attendance/
│   │   │   ├── leaves/
│   │   │   ├── schedules/
│   │   │   ├── time-adjustments/
│   │   │   ├── audit-logs/
│   │   │   ├── users/          # Super-admin only
│   │   │   └── settings/       # Super-admin only
│   │   ├── employee/           # Employee dashboard routes
│   │   │   ├── layout.tsx      # Employee layout with sidebar
│   │   │   ├── dashboard/
│   │   │   ├── attendance/
│   │   │   ├── leaves/
│   │   │   ├── schedule/
│   │   │   └── profile/
│   │   ├── auth/               # Authentication routes
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   └── api/                # API routes (Next.js Route Handlers)
│   │       ├── auth/
│   │       ├── users/
│   │       ├── attendance/
│   │       ├── time-entries/
│   │       ├── schedules/
│   │       ├── leave/
│   │       ├── time-adjustments/
│   │       ├── audit-logs/
│   │       ├── notifications/
│   │       ├── system-settings/
│   │       └── uploads/
│   ├── components/
│   │   ├── admin/              # Admin-specific components
│   │   │   └── UserModal.tsx
│   │   ├── employee/           # Employee-specific components
│   │   │   └── TimeKeepingCard.tsx
│   │   └── shared/             # Shared/reusable components
│   │       ├── Sidebar.tsx
│   │       ├── LayoutWrapper.tsx
│   │       ├── StatCard.tsx
│   │       ├── Pagination.tsx
│   │       ├── ConfirmModal.tsx
│   │       ├── NotificationPanel.tsx
│   │       ├── WebcamCapture.tsx
│   │       ├── AttendanceCaptureModal.tsx
│   │       ├── DtrPreview.tsx
│   │       └── DtrDownloadButton.tsx
│   ├── hooks/                  # React Query hooks
│   │   ├── useAttendance.ts
│   │   ├── useUsers.ts
│   │   ├── useSchedules.ts
│   │   ├── useLeaves.ts
│   │   ├── useTimeEntries.ts
│   │   ├── useTimeAdjustments.ts
│   │   ├── useAuditLogs.ts
│   │   ├── useAbsences.ts
│   │   └── useSystemSettings.ts
│   ├── lib/
│   │   ├── logger.ts           # Winston logger configuration
│   │   ├── toast.tsx           # Toast notification wrapper
│   │   ├── api/
│   │   │   └── client.ts       # Axios API client with interceptors
│   │   ├── db/
│   │   │   └── mongodb.ts      # MongoDB/Mongoose connection
│   │   ├── hooks/
│   │   │   └── useNotifications.ts
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT auth middleware (requireAuth, requireAdmin)
│   │   ├── models/             # Mongoose models
│   │   │   ├── User.ts
│   │   │   ├── Attendance.ts
│   │   │   ├── TimeEntry.ts
│   │   │   ├── Schedule.ts
│   │   │   ├── Leave.ts
│   │   │   ├── TimeAdjustment.ts
│   │   │   ├── AuditLog.ts
│   │   │   ├── Notification.ts
│   │   │   ├── Absence.ts
│   │   │   └── SystemSettings.ts
│   │   └── utils/              # Utility functions
│   │       ├── auditLog.ts     # Audit log helper + constants
│   │       ├── helpers.ts      # General helpers (formatTime, getPhilippineTime, etc.)
│   │       ├── email.ts        # Nodemailer email utils
│   │       └── employee.ts     # Employee-specific utils
│   ├── server/
│   │   ├── controllers/        # API route controllers
│   │   │   └── attendanceController.ts
│   │   └── services/           # Business logic services
│   │       ├── attendanceService.ts
│   │       ├── authService.ts
│   │       ├── userService.ts
│   │       ├── scheduleService.ts
│   │       ├── leaveService.ts
│   │       ├── timeEntryService.ts
│   │       ├── timeAdjustmentService.ts
│   │       ├── notificationService.ts
│   │       └── absenceService.ts
│   ├── stores/
│   │   └── authStore.ts        # Zustand auth store (persisted)
│   ├── styles/
│   │   └── globals.css         # Global styles + Tailwind + CSS variables
│   └── types/
│       └── index.ts            # All TypeScript interfaces and types
├── ecosystem.config.js         # PM2 configuration
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3 (strict mode) |
| Database | MongoDB with Mongoose 8 |
| State Management | Zustand (auth), React Query (server state) |
| Styling | Tailwind CSS 3.4 + CSS Variables |
| Forms | React Hook Form + Zod validation |
| API Client | Axios with interceptors |
| Authentication | JWT (jsonwebtoken) |
| File Storage | AWS S3 |
| Logging | Winston with daily rotate |
| Icons | Lucide React |
| Notifications | react-hot-toast |
| PDF Generation | jsPDF + html2canvas |
| Camera | react-webcam |
| Date Handling | date-fns + date-fns-tz |
| Deployment | PM2 (cluster mode) + NGINX |

---

## 📝 Coding Standards

### TypeScript Guidelines

```typescript
// ALWAYS import types from @/types
import { IUser, IAttendance, ISchedule, DayOfWeek } from '@/types';

// Use unknown for error handling, then cast appropriately
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
  // Or for Axios errors
  const axiosError = error as { 
    response?: { status: number; data?: { message?: string } }; 
    message?: string 
  };
}

// Use proper return types
async function fetchUser(id: string): Promise<IUser | null> {
  // ...
}

// Use union types for specific values
type UserRole = 'admin' | 'employee' | 'super-admin';
type AttendanceStatus = 'present' | 'absent' | 'on-leave' | 'holiday';
```

### Interface Naming Convention

All interfaces in `@/types` follow the `I` prefix pattern:

```typescript
// Types file exports
export interface IUser { ... }
export interface IAttendance { ... }
export interface ISchedule { ... }
export interface ITimeEntry { ... }
export interface ILeave { ... }
export interface IAuditLog { ... }

// DTOs (Data Transfer Objects)
export interface CreateUserDto { ... }
export interface UpdateScheduleDto { ... }
```

### Import Conventions

```typescript
// React and Next.js
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Types - ALWAYS from @/types
import { IUser, IAttendance, DayOfWeek } from '@/types';

// Components
import { Sidebar } from '@/components/shared/Sidebar';
import { StatCard } from '@/components/shared/StatCard';

// Hooks (React Query)
import { useAttendances } from '@/hooks/useAttendance';
import { useUsers } from '@/hooks/useUsers';

// Stores (Zustand)
import { useAuthStore } from '@/stores/authStore';

// API Client
import { apiClient } from '@/lib/api/client';

// Utils
import { formatTime, getPhilippineTime } from '@/lib/utils/helpers';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/utils/auditLog';

// Toast
import { toast } from '@/lib/toast';

// Icons (Lucide)
import { Clock, Calendar, Users, Settings } from 'lucide-react';
```

---

## 🏗 Architecture Patterns

### API Versioning Strategy

**Why API Versioning?**
- **Security** - Deprecate old endpoints with vulnerabilities without breaking existing clients
- **Backward Compatibility** - Old clients continue working while new features are added
- **Clean Upgrades** - Introduce breaking changes in new versions without affecting production
- **Documentation** - Clear separation of API capabilities per version

#### Current State Analysis

```
Current Structure (Unversioned):
src/app/api/
├── users/route.ts           → /api/users
├── attendance/route.ts      → /api/attendance
├── auth/login/route.ts      → /api/auth/login
├── schedules/route.ts       → /api/schedules
└── ...

Problems:
- No version control for API changes
- Breaking changes affect all clients immediately
- No deprecation strategy
- Security patches require immediate client updates
```

#### Target State (Versioned)

```
Target Structure:
src/app/api/
├── v1/                              # Version 1 (stable)
│   ├── users/
│   │   ├── route.ts                 → /api/v1/users
│   │   └── [id]/route.ts            → /api/v1/users/:id
│   ├── attendance/route.ts          → /api/v1/attendance
│   ├── auth/
│   │   ├── login/route.ts           → /api/v1/auth/login
│   │   ├── logout/route.ts          → /api/v1/auth/logout
│   │   ├── register/route.ts        → /api/v1/auth/register
│   │   ├── forgot-password/route.ts → /api/v1/auth/forgot-password
│   │   └── reset-password/route.ts  → /api/v1/auth/reset-password
│   ├── schedules/route.ts           → /api/v1/schedules
│   ├── time-entries/route.ts        → /api/v1/time-entries
│   ├── leaves/route.ts              → /api/v1/leaves
│   ├── time-adjustments/route.ts    → /api/v1/time-adjustments
│   ├── audit-logs/route.ts          → /api/v1/audit-logs
│   ├── notifications/route.ts       → /api/v1/notifications
│   ├── system-settings/route.ts     → /api/v1/system-settings
│   ├── dashboard/route.ts           → /api/v1/dashboard
│   ├── absence/route.ts             → /api/v1/absence
│   └── uploads/route.ts             → /api/v1/uploads
├── health/route.ts                  # Unversioned (utility)
└── debug/route.ts                   # Unversioned (dev only)
```

---

### Implementation Architecture

#### 1. API Configuration Constants

```typescript
// src/lib/api/config.ts
export const API_CONFIG = {
  CURRENT_VERSION: 'v1',
  SUPPORTED_VERSIONS: ['v1'] as const,
  DEPRECATED_VERSIONS: [] as const,
  BASE_PATH: '/api',
} as const;

export type ApiVersion = typeof API_CONFIG.SUPPORTED_VERSIONS[number];

// Build versioned path
export function getVersionedPath(version: ApiVersion = API_CONFIG.CURRENT_VERSION): string {
  return `${API_CONFIG.BASE_PATH}/${version}`;
}
```

#### 2. Versioned API Client

```typescript
// src/lib/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { API_CONFIG, ApiVersion, getVersionedPath } from './config';

class ApiClient {
  private client: AxiosInstance;
  private version: ApiVersion;

  constructor(version: ApiVersion = API_CONFIG.CURRENT_VERSION) {
    this.version = version;
    this.client = axios.create({
      baseURL: getVersionedPath(version),
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Add version header for tracking
        config.headers['X-API-Version'] = this.version;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors & deprecation warnings
    this.client.interceptors.response.use(
      (response) => {
        // Check for deprecation headers
        const deprecated = response.headers['x-api-deprecated'];
        const sunset = response.headers['sunset'];
        if (deprecated === 'true' && sunset) {
          console.warn(`API ${this.version} is deprecated. Sunset date: ${sunset}`);
        }
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          const errorData = error.response?.data as { error?: string };
          const errorMessage = errorData?.error || 'Session expired';
          
          if (typeof window !== 'undefined') {
            import('@/lib/toast').then(({ toast }) => {
              toast.error(`${errorMessage}. Please login again.`);
            });
          }
          
          useAuthStore.getState().logout();
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: CreateUserDto) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.client.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await this.client.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }

  // ============================================
  // USER ENDPOINTS
  // ============================================
  async getUsers(role?: string) {
    const response = await this.client.get('/users', { params: { role } });
    return response.data;
  }

  async getUserById(userId: string) {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  async createUser(data: CreateUserDto) {
    const response = await this.client.post('/users', data);
    return response.data;
  }

  async updateUser(userId: string, data: UpdateUserDto) {
    const response = await this.client.patch(`/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.client.delete(`/users/${userId}`);
    return response.data;
  }

  // ============================================
  // ATTENDANCE ENDPOINTS
  // ============================================
  async getAttendance(userId?: string, startDate?: string, endDate?: string) {
    const response = await this.client.get('/attendance', {
      params: { userId, startDate, endDate },
    });
    return response.data;
  }

  // ============================================
  // SCHEDULE ENDPOINTS
  // ============================================
  async getSchedules(userId?: string) {
    const response = await this.client.get('/schedules', { params: { userId } });
    return response.data;
  }

  async createSchedule(data: CreateScheduleDto) {
    const response = await this.client.post('/schedules', data);
    return response.data;
  }

  async updateSchedule(scheduleId: string, data: UpdateScheduleDto) {
    const response = await this.client.patch(`/schedules/${scheduleId}`, data);
    return response.data;
  }

  async deleteSchedule(scheduleId: string) {
    const response = await this.client.delete(`/schedules/${scheduleId}`);
    return response.data;
  }

  // ============================================
  // TIME ENTRY ENDPOINTS
  // ============================================
  async clockIn(photoBase64: string, location?: LocationDto) {
    const response = await this.client.post('/time-entries', {
      type: 'time-in',
      photoBase64,
      location,
    });
    return response.data;
  }

  async clockOut(photoBase64: string, location?: LocationDto) {
    const response = await this.client.post('/time-entries', {
      type: 'time-out',
      photoBase64,
      location,
    });
    return response.data;
  }

  async getTimeEntries(userId?: string, startDate?: string, endDate?: string) {
    const response = await this.client.get('/time-entries', {
      params: { userId, startDate, endDate },
    });
    return response.data;
  }

  // ============================================
  // LEAVE ENDPOINTS
  // ============================================
  async getLeaves() {
    const response = await this.client.get('/leaves');
    return response.data;
  }

  async createLeave(data: CreateLeaveDto) {
    const response = await this.client.post('/leaves', data);
    return response.data;
  }

  async updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected', remarks?: string) {
    const response = await this.client.patch(`/leaves/${leaveId}`, { status, remarks });
    return response.data;
  }

  // ============================================
  // SYSTEM SETTINGS ENDPOINTS
  // ============================================
  async getSystemSettings() {
    const response = await this.client.get('/system-settings');
    return response.data;
  }

  async updateSystemSettings(data: UpdateSystemSettingsDto) {
    const response = await this.client.patch('/system-settings', data);
    return response.data;
  }

  // ============================================
  // DASHBOARD ENDPOINTS
  // ============================================
  async getDashboardStats() {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }

  // ============================================
  // AUDIT LOG ENDPOINTS
  // ============================================
  async getAuditLogs(params?: AuditLogQueryParams) {
    const response = await this.client.get('/audit-logs', { params });
    return response.data;
  }

  // ============================================
  // NOTIFICATION ENDPOINTS
  // ============================================
  async getNotifications() {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  async markNotificationRead(notificationId: string) {
    const response = await this.client.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }
}

// Export singleton for current version
export const apiClient = new ApiClient('v1');

// Factory for specific versions (future use)
export function createApiClient(version: ApiVersion): ApiClient {
  return new ApiClient(version);
}
```

#### 3. Versioned Hooks with Centralized Path

```typescript
// src/lib/api/paths.ts
import { API_CONFIG } from './config';

const V = API_CONFIG.CURRENT_VERSION;

// Centralized API paths - change once, updates everywhere
export const API_PATHS = {
  // Auth
  AUTH_LOGIN: `/api/${V}/auth/login`,
  AUTH_REGISTER: `/api/${V}/auth/register`,
  AUTH_FORGOT_PASSWORD: `/api/${V}/auth/forgot-password`,
  AUTH_RESET_PASSWORD: `/api/${V}/auth/reset-password`,
  
  // Users
  USERS: `/api/${V}/users`,
  USER_BY_ID: (id: string) => `/api/${V}/users/${id}`,
  
  // Attendance
  ATTENDANCE: `/api/${V}/attendance`,
  
  // Schedules
  SCHEDULES: `/api/${V}/schedules`,
  SCHEDULE_BY_ID: (id: string) => `/api/${V}/schedules/${id}`,
  
  // Time Entries
  TIME_ENTRIES: `/api/${V}/time-entries`,
  
  // Leaves
  LEAVES: `/api/${V}/leaves`,
  LEAVE_BY_ID: (id: string) => `/api/${V}/leaves/${id}`,
  
  // Time Adjustments
  TIME_ADJUSTMENTS: `/api/${V}/time-adjustments`,
  TIME_ADJUSTMENT_BY_ID: (id: string) => `/api/${V}/time-adjustments/${id}`,
  
  // Audit Logs
  AUDIT_LOGS: `/api/${V}/audit-logs`,
  
  // Notifications
  NOTIFICATIONS: `/api/${V}/notifications`,
  NOTIFICATION_BY_ID: (id: string) => `/api/${V}/notifications/${id}`,
  
  // System Settings
  SYSTEM_SETTINGS: `/api/${V}/system-settings`,
  
  // Dashboard
  DASHBOARD_STATS: `/api/${V}/dashboard/stats`,
  
  // Absence
  ABSENCE: `/api/${V}/absence`,
  
  // Uploads
  UPLOADS: `/api/${V}/uploads`,
} as const;
```

#### 4. Updated Hook Pattern

```typescript
// src/hooks/useUsers.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_PATHS } from '@/lib/api/paths';
import { IUser, CreateUserDto, UpdateUserDto } from '@/types';

interface UsersResponse {
  success: boolean;
  users: IUser[];
}

async function fetchUsers(role?: string): Promise<UsersResponse> {
  const search = new URLSearchParams();
  if (role) search.set('role', role);
  const url = `${API_PATHS.USERS}${search.toString() ? `?${search}` : ''}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export function useUsers(role?: string) {
  return useQuery({
    queryKey: ['users', role],
    queryFn: () => fetchUsers(role),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserDto) => {
      const res = await fetch(API_PATHS.USERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create user');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateUserDto }) => {
      const res = await fetch(API_PATHS.USER_BY_ID(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update user');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(API_PATHS.USER_BY_ID(id), { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
```

#### 5. Version Middleware

```typescript
// src/lib/middleware/apiVersion.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/api/config';

interface VersionInfo {
  version: string;
  deprecated: boolean;
  sunset?: string; // ISO date when version will be removed
}

const VERSION_INFO: Record<string, VersionInfo> = {
  v1: { version: 'v1', deprecated: false },
  // Future: v2: { version: 'v2', deprecated: false },
};

export function withApiVersion(version: string) {
  return function <T extends (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (request: NextRequest, ...args: unknown[]) => {
      const response = await handler(request, ...args);
      
      // Clone response to add headers
      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Add version headers
      const info = VERSION_INFO[version];
      if (info) {
        newResponse.headers.set('X-API-Version', info.version);
        newResponse.headers.set('X-API-Deprecated', String(info.deprecated));
        if (info.sunset) {
          newResponse.headers.set('Sunset', info.sunset);
        }
      }

      return newResponse;
    }) as T;
  };
}

// Combine with auth middleware
export function withVersionedAuth(version: string) {
  return function <T extends (request: NextRequest, user: AuthUser) => Promise<NextResponse>>(
    handler: T
  ) {
    return withApiVersion(version)(requireAuth(handler));
  };
}

export function withVersionedAdmin(version: string) {
  return function <T extends (request: NextRequest, user: AuthUser) => Promise<NextResponse>>(
    handler: T
  ) {
    return withApiVersion(version)(requireAdmin(handler));
  };
}
```

#### 6. Versioned Route Structure

```typescript
// src/app/api/v1/users/route.ts
import { withVersionedAdmin } from '@/lib/middleware/apiVersion';
import * as controller from '@/server/controllers/userController';

export const GET = withVersionedAdmin('v1')(controller.getUsers);
export const POST = withVersionedAdmin('v1')(controller.createUser);

// src/app/api/v1/users/[id]/route.ts
import { withVersionedAdmin } from '@/lib/middleware/apiVersion';
import * as controller from '@/server/controllers/userController';

export const GET = withVersionedAdmin('v1')(controller.getUserById);
export const PATCH = withVersionedAdmin('v1')(controller.updateUser);
export const DELETE = withVersionedAdmin('v1')(controller.deleteUser);
```

---

### Migration Strategy

#### Phase 1: Preparation (No Breaking Changes)

```bash
# 1. Create new folder structure
mkdir -p src/app/api/v1

# 2. Create API config files
touch src/lib/api/config.ts
touch src/lib/api/paths.ts

# 3. Create version middleware
touch src/lib/middleware/apiVersion.ts
```

#### Phase 2: Create Versioned Routes

```typescript
// Copy existing routes to v1 folder with version middleware
// Keep original routes as aliases (backward compatibility)

// src/app/api/users/route.ts (KEEP - backward compatibility)
export { GET, POST, PATCH, DELETE } from '../v1/users/route';

// src/app/api/v1/users/route.ts (NEW - versioned)
import { withVersionedAdmin } from '@/lib/middleware/apiVersion';
import * as controller from '@/server/controllers/userController';

export const GET = withVersionedAdmin('v1')(controller.getUsers);
export const POST = withVersionedAdmin('v1')(controller.createUser);
export const PATCH = withVersionedAdmin('v1')(controller.updateUser);
export const DELETE = withVersionedAdmin('v1')(controller.deleteUser);
```

#### Phase 3: Update Client Code

```typescript
// Update API client to use versioned paths
// Update all hooks to use API_PATHS

// Change:
const res = await fetch('/api/users');

// To:
import { API_PATHS } from '@/lib/api/paths';
const res = await fetch(API_PATHS.USERS);
```

#### Phase 4: Deprecation (Future)

```typescript
// When ready to deprecate old unversioned routes:
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use /api/v1/users',
      migration: 'https://docs.example.com/api-migration'
    },
    { 
      status: 410, // Gone
      headers: {
        'X-API-Deprecated': 'true',
        'Sunset': 'Sat, 01 Jun 2026 00:00:00 GMT',
        'Link': '</api/v1/users>; rel="successor-version"'
      }
    }
  );
}
```

---

### API Versioning Best Practices

#### Do's

```typescript
// 1. Always version new endpoints from start
// /api/v1/new-feature ✓

// 2. Use semantic versioning for major breaking changes
// v1 → v2 (breaking), v1.1 (minor, same base)

// 3. Document version changes
/**
 * @version v1
 * @since 2024-01-01
 * @deprecated false
 */
export async function getUsers() { }

// 4. Return version in response headers
response.headers.set('X-API-Version', 'v1');

// 5. Support content negotiation (optional)
// Accept: application/vnd.tkms.v1+json
```

#### Don'ts

```typescript
// 1. Don't change response structure in same version
// v1 returns { users: [] }
// v1 should NOT change to { data: { users: [] } }

// 2. Don't remove fields in same version
// v1: { id, name, email }
// v1 should NOT become { id, name } (removed email)

// 3. Don't change HTTP methods in same version
// v1: GET /users/:id
// v1 should NOT become POST /users/get

// 4. Don't mix versioned and unversioned in new code
// Always use API_PATHS for consistency
```

---

### Response Headers for Versioning

```typescript
// Standard response with version headers
return NextResponse.json(
  { success: true, data },
  {
    headers: {
      'X-API-Version': 'v1',
      'X-API-Deprecated': 'false',
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Remaining': '999',
      // When deprecating:
      // 'Sunset': 'Sat, 01 Jun 2026 00:00:00 GMT',
      // 'Deprecation': 'true',
      // 'Link': '</api/v2/users>; rel="successor-version"'
    },
  }
);
```

---

### API Route Pattern (Next.js App Router)

```typescript
// src/app/api/attendance/route.ts
import { requireAuth } from '@/lib/middleware/auth';
import * as controller from '@/server/controllers/attendanceController';

// Routes delegate to controllers
export const GET = requireAuth(controller.getAttendances);
export const POST = requireAuth(controller.createAttendance);
```

### Controller Pattern

```typescript
// src/server/controllers/attendanceController.ts
import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/server/services/attendanceService';
import logger from '@/lib/logger';

export async function getAttendances(request: NextRequest, user: AuthUser) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Role-based access control
    if (user.role !== 'admin' && user.role !== 'super-admin') {
      // Employees can only see their own
    }
    
    const attendances = await service.findAttendances({ startDate, endDate });
    return NextResponse.json({ success: true, attendances });
  } catch (err: unknown) {
    const error = err as Error;
    logger.error('getAttendances error', { 
      message: error.message, 
      stack: error.stack,
      route: '/api/attendance',
      user: user?.userId 
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Service Pattern

```typescript
// src/server/services/attendanceService.ts
import connectDB from '@/lib/db/mongodb';
import Attendance from '@/lib/models/Attendance';

interface FindAttendancesParams {
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export async function findAttendances(params: FindAttendancesParams) {
  await connectDB();
  
  const query: Record<string, unknown> = {};
  if (params.userId) query.userId = params.userId;
  if (params.startDate && params.endDate) {
    query.date = { $gte: new Date(params.startDate), $lte: new Date(params.endDate) };
  }
  
  return Attendance.find(query)
    .populate('timeIn')
    .populate('timeOut')
    .sort({ date: -1 });
}
```

### React Query Hook Pattern

```typescript
// src/hooks/useAttendance.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FetchParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
}

async function fetchAttendances(params: FetchParams = {}) {
  const search = new URLSearchParams();
  if (params.startDate) search.set('startDate', params.startDate);
  if (params.endDate) search.set('endDate', params.endDate);
  if (params.userId) search.set('userId', params.userId);
  
  const res = await fetch(`/api/attendance?${search.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch attendances');
  return res.json();
}

export function useAttendances(params?: FetchParams) {
  return useQuery({
    queryKey: ['attendances', params],
    queryFn: () => fetchAttendances(params),
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: CreateAttendanceDto) => {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create attendance');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
    },
  });
}
```

### Zustand Store Pattern

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/types';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (user: IUser, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<IUser>) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
```

---

## 🧩 Component Guidelines

### Client Component Template

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from '@/lib/toast';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { IUser, IAttendance } from '@/types';

interface Props {
  userId: string;
  onComplete?: () => void;
}

export const AttendanceCard: React.FC<Props> = ({ userId, onComplete }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<IAttendance | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, [userId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAttendance(userId);
      if (response.success) {
        setAttendance(response.attendance);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch attendance:', error);
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await apiClient.createTimeEntry({ userId, type: 'time-in' });
      toast.success('Time in recorded');
      onComplete?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to record time');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Component content */}
    </div>
  );
};
```

### Shared Component Location

| Component Type | Location |
|---------------|----------|
| Admin-only | `src/components/admin/` |
| Employee-only | `src/components/employee/` |
| Shared/Reusable | `src/components/shared/` |

---

## 🔐 Authentication & Authorization

### Auth Middleware Usage

```typescript
// Public route (no auth)
export const GET = handler;

// Authenticated route (any logged-in user)
export const GET = requireAuth(handler);

// Admin-only route (admin or super-admin)
export const GET = requireAdmin(handler);
```

### Role-Based Access

```typescript
// Three roles in system
type UserRole = 'admin' | 'employee' | 'super-admin';

// Permission levels:
// - employee: Own data only
// - admin: All employee data + some settings
// - super-admin: Full access including system settings, user management
```

### Protected Client Components

```tsx
'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/auth/login');
    }
    if (isHydrated && user?.role === 'employee') {
      router.push('/employee/dashboard');
    }
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated || !isAuthenticated) return null;

  return <div>Admin Content</div>;
}
```

---

## 📊 Audit Logging

### Using Audit Log Utility

```typescript
import { createAuditLog, AUDIT_ACTIONS, getClientIP, getUserAgent } from '@/lib/utils/auditLog';

// In API route or service
await createAuditLog({
  userId: user._id,
  userName: `${user.firstName} ${user.lastName}`,
  userRole: user.role,
  action: AUDIT_ACTIONS.TIME_IN,
  category: 'ATTENDANCE',
  description: `User clocked in at ${new Date().toISOString()}`,
  ipAddress: getClientIP(request),
  userAgent: getUserAgent(request),
  metadata: { scheduleId: schedule._id },
  status: 'SUCCESS',
});
```

### Audit Categories

```typescript
type AuditCategory = 'AUTH' | 'ATTENDANCE' | 'LEAVE' | 'SCHEDULE' | 'USER' | 'SYSTEM';
```

---

## 🎨 Styling Guidelines

### CSS Variables (Theme)

```css
/* Defined in globals.css, values from SystemSettings */
:root {
  --primary-color: #2563eb;
  --accent-color: #7c3aed;
  --sidebar-bg: #0f1724;
  --sidebar-text: #e6eef8;
  --sidebar-active-bg: #2563eb;
  --sidebar-hover-bg: #0b1220;
  --button-bg: #7c3aed;
  --button-text: #ffffff;
  --success-color: #16a34a;
  --danger-color: #dc2626;
}
```

### Using CSS Variables in Components

```tsx
// Tailwind with CSS variables
<button className="bg-[var(--primary-color)] hover:bg-[var(--primary-color-dark)]">
  Submit
</button>

// Or inline styles
<div style={{ backgroundColor: 'var(--sidebar-bg)' }}>
  Sidebar
</div>
```

### Tailwind Class Organization

```tsx
// Order: layout -> sizing -> spacing -> typography -> colors -> effects
<div className="flex flex-col w-full min-h-screen p-4 text-sm text-gray-700 bg-white rounded-lg shadow-md">
```

---

## ⚠️ Error Handling

### API Error Response Format

```typescript
// Success response
return NextResponse.json({ 
  success: true, 
  data: result,
  message: 'Operation successful' 
});

// Error response
return NextResponse.json({ 
  success: false,
  error: 'Error message here' 
}, { status: 400 });
```

### Client-Side Error Handling

```typescript
try {
  const response = await apiClient.createUser(data);
  if (response.success) {
    toast.success('User created successfully');
  }
} catch (error: unknown) {
  // Type-safe error handling
  const axiosError = error as {
    response?: {
      status: number;
      data?: { error?: string; message?: string };
    };
    message?: string;
  };

  if (axiosError.response) {
    // Server responded with error
    const message = axiosError.response.data?.error || 
                   axiosError.response.data?.message || 
                   'Request failed';
    toast.error(message);
  } else {
    // Network or other error
    toast.error('Network error. Please try again.');
  }
}
```

### Logging Errors (Server-Side)

```typescript
import logger from '@/lib/logger';

} catch (err: unknown) {
  const error = err as Error;
  logger.error('Operation failed', {
    message: error.message,
    stack: error.stack,
    route: '/api/endpoint',
    userId: user?.userId,
    metadata: { additionalInfo: 'context' }
  });
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

---

## 🕐 Date & Time Handling

### Philippine Timezone

```typescript
import { getPhilippineTime, formatTime, getCurrentDayOfWeek } from '@/lib/utils/helpers';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// Get current Philippine time
const now = getPhilippineTime(); // Returns Date in PH timezone

// Format for display
const timeString = formatTime(date); // "08:30 AM"

// Get day of week
const day = getCurrentDayOfWeek(); // "monday" | "tuesday" | etc.

// Timezone-aware formatting
const formatted = formatInTimeZone(date, 'Asia/Manila', 'yyyy-MM-dd HH:mm:ss');
```

### Schedule Time Format

```typescript
// Schedule times stored as HH:mm strings
interface ISchedule {
  timeIn: string;   // "08:00"
  timeOut: string;  // "17:00"
  lunchStart?: string; // "12:00"
  lunchEnd?: string;   // "13:00"
}
```

---

## 🔧 Quick Reference

| Need | Import From |
|------|-------------|
| Types (IUser, IAttendance, etc.) | `@/types` |
| Auth state (user, token, login, logout) | `@/stores/authStore` |
| API calls | `@/lib/api/client` |
| Toast notifications | `@/lib/toast` |
| React Query hooks | `@/hooks/useAttendance`, etc. |
| Date utilities | `@/lib/utils/helpers` |
| Audit logging | `@/lib/utils/auditLog` |
| Winston logger | `@/lib/logger` |
| Auth middleware | `@/lib/middleware/auth` |
| MongoDB connection | `@/lib/db/mongodb` |
| Mongoose models | `@/lib/models/*` |

---

## 🚫 Avoid These Patterns

```typescript
// NEVER use any - This is strictly forbidden!
const data: any = response.data;
} catch (error: any) { }
const items: any[] = [];

// DON'T duplicate utility functions
const formatCurrency = (amount: number) => { ... }; // Use shared utils

// DON'T import from deep paths when barrel exports exist
import { IUser } from '@/types/index';  // Just use '@/types'

// DON'T use console.log in production code
console.log('Debug:', data);  // Use logger.info() or logger.debug()

// DON'T hardcode timezone
new Date().toLocaleString('en-US');  // Use getPhilippineTime()

// DON'T skip error handling
const data = await fetch('/api/data');  // Always try/catch

// DON'T mutate state directly
user.name = 'New Name';  // Use updateUser() from store
```

---

## ✅ Code Review Checklist

### Type Safety
- [ ] No `any` types used anywhere (use `unknown` instead)
- [ ] All function parameters have explicit types
- [ ] All return types are specified for functions
- [ ] Error handling uses `unknown` type with proper casting
- [ ] Types imported from `@/types`

### Clean Code
- [ ] Variable/function names are descriptive and meaningful
- [ ] Functions are small and do ONE thing
- [ ] No magic numbers (use named constants)
- [ ] No deeply nested code (use early returns)
- [ ] Comments explain WHY, not WHAT

### Architecture
- [ ] API routes delegate to controllers
- [ ] Business logic in services
- [ ] Components use hooks for data fetching
- [ ] Auth checks in place for protected routes

### Error Handling
- [ ] All async operations wrapped in try/catch
- [ ] User-friendly error messages shown
- [ ] Errors logged with context (logger.error)
- [ ] API returns consistent error format

### Security
- [ ] Auth middleware on protected routes
- [ ] Role-based access control enforced
- [ ] No sensitive data logged
- [ ] Input validation with Zod

---

## 🛡️ Code Finalization Standards

### Before Completing Any Code Change:

```
1. CHECK FOR ERRORS
   - Run type-check (pnpm run type-check)
   - Fix any TypeScript errors
   - Fix any lint warnings

2. CHECK FOR UNUSED CODE
   - Remove unused imports
   - Remove unused variables/parameters
   - Remove commented-out code blocks

3. VERIFY COMPLETENESS
   - All related files updated
   - Interfaces match implementation
   - No broken references
   - Audit logging added where needed

4. TEST THE CHANGE
   - Verify the feature works
   - Check error scenarios
   - Test different user roles
```

---

## 📋 File Templates

### New API Route

```typescript
// src/app/api/[resource]/route.ts
import { requireAuth, requireAdmin } from '@/lib/middleware/auth';
import * as controller from '@/server/controllers/[resource]Controller';

export const GET = requireAuth(controller.getAll);
export const POST = requireAuth(controller.create);
```

### New Service

```typescript
// src/server/services/[resource]Service.ts
import connectDB from '@/lib/db/mongodb';
import Model from '@/lib/models/Model';
import { IModel } from '@/types';

export async function findAll(): Promise<IModel[]> {
  await connectDB();
  return Model.find().sort({ createdAt: -1 });
}

export async function create(data: CreateModelDto): Promise<IModel> {
  await connectDB();
  return Model.create(data);
}
```

### New Hook

```typescript
// src/hooks/useResource.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useResources(params?: QueryParams) {
  return useQuery({
    queryKey: ['resources', params],
    queryFn: () => fetchResources(params),
  });
}
```

---

*This document should be kept up to date as the project evolves. Last updated: January 2026*
