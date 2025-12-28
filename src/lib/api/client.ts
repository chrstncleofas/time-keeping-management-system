import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const _envApi = process.env.NEXT_PUBLIC_API_URL;
let API_URL: string;
if (!_envApi) {
  API_URL = '/api';
} else {
  const trimmed = _envApi.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) API_URL = trimmed;
  else API_URL = `${trimmed}/api`;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          const errorData = error.response?.data as any;
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

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  // User endpoints
  async getUsers(role?: string) {
    const response = await this.client.get('/users', { params: { role } });
    return response.data;
  }

  async updateUser(userId: string, data: any) {
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

  async createSchedule(data: any) {
    const response = await this.client.post('/schedules', data);
    return response.data;
  }

  async updateSchedule(scheduleId: string, data: any) {
    const response = await this.client.patch(`/schedules?id=${scheduleId}`, data);
    return response.data;
  }

  // Time entry endpoints
  async clockIn(photoBase64: string, location?: any) {
    const response = await this.client.post('/time-entries', {
      type: 'time-in',
      photoBase64,
      location,
    });
    return response.data;
  }

  async clockOut(photoBase64: string, location?: any) {
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

  async updateSystemSettings(data: any) {
    const response = await this.client.patch('/system-settings', data);
    return response.data;
  }
}

export const apiClient = new ApiClient();
