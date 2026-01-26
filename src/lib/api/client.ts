import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { API_CONFIG, getVersionedPath } from './config';

// Build base API URL with versioning
const _envApi = process.env.NEXT_PUBLIC_API_URL;
let BASE_API_URL: string;
if (!_envApi) {
  BASE_API_URL = '/api';
} else {
  const trimmed = _envApi.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) BASE_API_URL = trimmed;
  else BASE_API_URL = `${trimmed}/api`;
}

// Versioned API URL (e.g., /api/v1)
const API_URL = `${BASE_API_URL}/${API_CONFIG.CURRENT_VERSION}`;

class ApiClient {
  private client: AxiosInstance;
  private version: string;

  constructor(version: string = API_CONFIG.CURRENT_VERSION) {
    this.version = version;
    this.client = axios.create({
      baseURL: `${BASE_API_URL}/${version}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token and version header
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
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and deprecation warnings
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
          // Token expired or invalid
          const errorData = error.response?.data as { error?: string };
          const errorMessage = errorData?.error || 'Session expired';
          
          // Show toast notification
          if (typeof window !== 'undefined') {
            // Dynamic import to avoid SSR issues
            import('@/lib/toast').then(({ toast }) => {
              toast.error(errorMessage + '. Please login again.');
            });
          }
          
          useAuthStore.getState().logout();
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Get current API version
  getVersion(): string {
    return this.version;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: Record<string, unknown>) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  // User endpoints
  async getUsers(role?: string) {
    const response = await this.client.get('/users', { params: { role } });
    return response.data;
  }

  async updateUser(userId: string, data: Record<string, unknown>) {
    const response = await this.client.patch(`/users?id=${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.client.delete(`/users?id=${userId}`);
    return response.data;
  }

  // Schedule endpoints
  async getSchedules(userId?: string) {
    const response = await this.client.get('/schedules', { params: { userId } });
    return response.data;
  }

  async createSchedule(data: Record<string, unknown>) {
    const response = await this.client.post('/schedules', data);
    return response.data;
  }

  async updateSchedule(scheduleId: string, data: Record<string, unknown>) {
    const response = await this.client.patch(`/schedules?id=${scheduleId}`, data);
    return response.data;
  }

  // Time entry endpoints
  async clockIn(photoBase64: string, location?: Record<string, unknown>) {
    const response = await this.client.post('/time-entries', {
      type: 'time-in',
      photoBase64,
      location,
    });
    return response.data;
  }

  async clockOut(photoBase64: string, location?: Record<string, unknown>) {
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

  // Attendance endpoints
  async getAttendance(userId?: string, startDate?: string, endDate?: string) {
    const response = await this.client.get('/attendance', {
      params: { userId, startDate, endDate },
    });
    return response.data;
  }

  // Dashboard endpoints
  async getDashboardStats() {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }

  // System Settings endpoints
  async getSystemSettings() {
    const response = await this.client.get('/system-settings');
    return response.data;
  }

  async updateSystemSettings(data: Record<string, unknown>) {
    const response = await this.client.patch('/system-settings', data);
    return response.data;
  }
}

// Default export for current version (v1)
export const apiClient = new ApiClient();

// Factory for creating clients for specific versions (future use)
export function createApiClient(version: string = API_CONFIG.CURRENT_VERSION): ApiClient {
  return new ApiClient(version);
}
