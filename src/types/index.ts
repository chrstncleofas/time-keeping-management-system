export interface IUser {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: 'admin' | 'employee' | 'super-admin';
  employeeId?: string;
  position?: string;
  department?: string;
  birthday?: Date;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  mobileNumber?: string;
  sss?: string;
  philhealth?: string;
  pagibig?: string;
  tin?: string;
  photoUrl?: string;
  leaveCredits: number;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISchedule {
  _id: string;
  userId: string;
  days: DayOfWeek[];
  timeIn: string; // Format: "HH:mm" (e.g., "08:00")
  lunchStart?: string; // Format: "HH:mm" (e.g., "12:00")
  lunchEnd?: string; // Format: "HH:mm" (e.g., "13:00")
  timeOut: string; // Format: "HH:mm" (e.g., "17:00")
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeEntry {
  _id: string;
  userId: string;
  type: 'time-in' | 'time-out';
  timestamp: Date;
  photoUrl: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendance {
  _id: string;
  userId: string;
  date: Date;
  timeIn?: ITimeEntry;
  timeOut?: ITimeEntry;
  totalHours?: number;
  lunchBreakMinutes?: number; // Lunch break deduction in minutes
  workedHours?: number; // Total hours minus lunch break
  overtimeMinutes?: number; // Minutes counted as overtime (beyond schedule end)
  overtimeHours?: number; // Overtime in hours (rounded)
  lateMinutes?: number;
  earlyOutMinutes?: number;
  isLate: boolean;
  isEarlyOut: boolean;
  status: 'present' | 'absent' | 'on-leave' | 'holiday';
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'employee' | 'super-admin';
  action: string;
  category: 'AUTH' | 'ATTENDANCE' | 'LEAVE' | 'SCHEDULE' | 'USER' | 'SYSTEM';
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  status: 'SUCCESS' | 'FAILED';
  createdAt: Date;
}

export type DayOfWeek = 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday' 
  | 'saturday' 
  | 'sunday';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: 'admin' | 'employee';
  employeeId?: string;
  birthday?: Date;
  gender?: 'male' | 'female' | 'other';
  mobileNumber?: string;
  sss?: string;
  philhealth?: string;
  pagibig?: string;
  tin?: string;
  photoUrl?: string;
  leaveCredits?: number;
}

export interface CreateScheduleDto {
  userId: string;
  days: DayOfWeek[];
  timeIn: string;
  timeOut: string;
}

export interface CreateTimeEntryDto {
  userId: string;
  type: 'time-in' | 'time-out';
  photoBase64: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateScheduleDto {
  days?: DayOfWeek[];
  timeIn?: string;
  timeOut?: string;
  isActive?: boolean;
}

export interface TimeEntryStats {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalEarlyOut: number;
  totalHours: number;
}

export interface ILeave {
  _id: string;
  userId: string;
  leaveType: 'sick' | 'vacation' | 'emergency' | 'personal' | 'other';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAbsence {
  _id: string;
  userId: string;
  date: Date;
  reason: string;
  notes?: string;
  markedBy: string; // Admin ID
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLeaveDto {
  userId: string;
  leaveType: 'sick' | 'vacation' | 'emergency' | 'personal' | 'other';
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface UpdateLeaveDto {
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
}
