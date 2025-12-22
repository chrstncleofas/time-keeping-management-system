import AuditLog, { IAuditLog } from '@/lib/models/AuditLog';
import mongoose from 'mongoose';

interface CreateAuditLogParams {
  userId: string | mongoose.Types.ObjectId;
  userName: string;
  userRole: 'admin' | 'employee' | 'super-admin';
  action: string;
  category: 'AUTH' | 'ATTENDANCE' | 'LEAVE' | 'SCHEDULE' | 'USER' | 'SYSTEM';
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  status?: 'SUCCESS' | 'FAILED';
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await AuditLog.create({
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      category: params.category,
      description: params.description,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
      status: params.status || 'SUCCESS',
    });
  } catch (error) {
    // Don't throw error, just log it to avoid breaking the main operation
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get IP address from Next.js request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

// Common audit log actions
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  
  // Attendance
  TIME_IN: 'TIME_IN',
  TIME_OUT: 'TIME_OUT',
  
  // Leave
  LEAVE_REQUEST_CREATED: 'LEAVE_REQUEST_CREATED',
  LEAVE_REQUEST_APPROVED: 'LEAVE_REQUEST_APPROVED',
  LEAVE_REQUEST_REJECTED: 'LEAVE_REQUEST_REJECTED',
  LEAVE_REQUEST_CANCELLED: 'LEAVE_REQUEST_CANCELLED',
  
  // Schedule
  SCHEDULE_CREATED: 'SCHEDULE_CREATED',
  SCHEDULE_UPDATED: 'SCHEDULE_UPDATED',
  SCHEDULE_DELETED: 'SCHEDULE_DELETED',
  
  // User Management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  
  // System
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
} as const;
