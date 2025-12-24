import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toZonedTime } from 'date-fns-tz';
import { format, parseISO, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';

// Philippine timezone constant
export const PHILIPPINE_TIMEZONE = 'Asia/Manila';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert date to Philippine time
export function toPhilippineTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, PHILIPPINE_TIMEZONE);
}

// Get current time in Philippine timezone
export function getPhilippineTime(): Date {
  return toZonedTime(new Date(), PHILIPPINE_TIMEZONE);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const phTime = toPhilippineTime(dateObj);
  return format(phTime, 'MMM dd, yyyy');
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const phTime = toPhilippineTime(dateObj);
  return format(phTime, 'hh:mm a');
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const phTime = toPhilippineTime(dateObj);
  return format(phTime, 'MMM dd, yyyy hh:mm a');
}

export function calculateHours(timeIn: Date | string, timeOut: Date | string): number {
  const timeInDate = typeof timeIn === 'string' ? parseISO(timeIn) : timeIn;
  const timeOutDate = typeof timeOut === 'string' ? parseISO(timeOut) : timeOut;
  
  const minutes = differenceInMinutes(timeOutDate, timeInDate);
  const totalHours = minutes / 60;
  
  // DOLE Compliance: Automatic lunch break deduction
  // If work duration is more than 6 hours, deduct 1 hour for lunch break
  // If work duration is 4-6 hours, deduct 30 minutes
  // Less than 4 hours, no deduction
  let workedHours = totalHours;
  
  if (totalHours > 6) {
    workedHours = totalHours - 1; // Deduct 1 hour for lunch break
  } else if (totalHours >= 4) {
    workedHours = totalHours - 0.5; // Deduct 30 minutes for break
  }
  
  return Math.round(workedHours * 100) / 100; // Round to 2 decimal places
}

// Calculate detailed hours with lunch break breakdown
export function calculateDetailedHours(
  timeIn: Date | string,
  timeOut: Date | string,
  scheduleLunchStart?: string,
  scheduleLunchEnd?: string,
  scheduleStartTime?: string,
  scheduleEndTime?: string
): {
  totalMinutes: number;
  totalHours: number;
  lunchBreakMinutes: number;
  workedHours: number;
  overtimeMinutes: number;
  overtimeHours: number;
} {
  const timeInDate = typeof timeIn === 'string' ? parseISO(timeIn) : timeIn;
  const timeOutDate = typeof timeOut === 'string' ? parseISO(timeOut) : timeOut;

  // If schedule start/end provided, clamp the effective interval to the scheduled window
  let effectiveIn = new Date(timeInDate);
  let effectiveOut = new Date(timeOutDate);

  if (scheduleStartTime) {
    const [sh, sm] = scheduleStartTime.split(':').map(Number);
    const scheduleStartDate = new Date(effectiveIn);
    scheduleStartDate.setHours(sh, sm, 0, 0);
    if (effectiveIn < scheduleStartDate) effectiveIn = scheduleStartDate;
  }

  // Do NOT clamp effectiveOut to schedule end here — we need the full interval to compute overtime.
  // We'll compute regular (scheduled) worked minutes separately using scheduleStartTime/scheduleEndTime.

  let scheduleStartDate: Date | null = null;
  let scheduleEndDate: Date | null = null;
  if (scheduleStartTime) {
    const [sh, sm] = scheduleStartTime.split(':').map(Number);
    scheduleStartDate = new Date(timeInDate);
    scheduleStartDate.setHours(sh, sm, 0, 0);
  }
  if (scheduleEndTime) {
    const [eh, em] = scheduleEndTime.split(':').map(Number);
    scheduleEndDate = new Date(timeOutDate);
    scheduleEndDate.setHours(eh, em, 0, 0);
  }

  let totalMinutes = differenceInMinutes(effectiveOut, effectiveIn);
  if (totalMinutes < 0) totalMinutes = 0;
  const totalHours = totalMinutes / 60;

  // Determine lunch break minutes by calculating overlap between worked interval and lunch interval (if provided)
  let lunchBreakMinutes = 0;

  if (scheduleLunchStart && scheduleLunchEnd) {
    const [lh, lm] = scheduleLunchStart.split(':').map(Number);
    const [lEH, lEM] = scheduleLunchEnd.split(':').map(Number);
    const lunchStartDate = new Date(effectiveIn);
    lunchStartDate.setHours(lh, lm, 0, 0);
    const lunchEndDate = new Date(effectiveIn);
    lunchEndDate.setHours(lEH, lEM, 0, 0);

    const overlapStart = effectiveIn > lunchStartDate ? effectiveIn : lunchStartDate;
    const overlapEnd = effectiveOut < lunchEndDate ? effectiveOut : lunchEndDate;
    const overlap = differenceInMinutes(overlapEnd, overlapStart);
    lunchBreakMinutes = overlap > 0 ? overlap : 0;
  } else {
    // Fallback to automatic DOLE compliance calculation using totalHours
    if (totalHours > 6) {
      lunchBreakMinutes = 60;
    } else if (totalHours >= 4) {
      lunchBreakMinutes = 30;
    }
  }

  const workedMinutes = Math.max(0, totalMinutes - lunchBreakMinutes);
  const workedHours = workedMinutes / 60;

  // Compute overtime: time beyond scheduleEndDate (or 0 if not provided)
  let overtimeMinutes = 0;
  if (scheduleEndDate) {
    const otStart = scheduleEndDate;
    if (effectiveOut > otStart) {
      overtimeMinutes = differenceInMinutes(effectiveOut, otStart);
      // exclude any lunch overlap that falls inside overtime window (unlikely but safe)
      if (lunchBreakMinutes > 0 && scheduleLunchStart && scheduleLunchEnd) {
        // lunch overlap already subtracted from workedMinutes; ensure overtime excludes lunch overlap portion
        const [lh, lm] = scheduleLunchStart.split(':').map(Number);
        const [lEH, lEM] = scheduleLunchEnd.split(':').map(Number);
        const lunchStartDate = new Date(effectiveIn);
        lunchStartDate.setHours(lh, lm, 0, 0);
        const lunchEndDate = new Date(effectiveIn);
        lunchEndDate.setHours(lEH, lEM, 0, 0);
        const overlapStart = otStart > lunchStartDate ? otStart : lunchStartDate;
        const overlapEnd = effectiveOut < lunchEndDate ? effectiveOut : lunchEndDate;
        const overlap = differenceInMinutes(overlapEnd, overlapStart);
        if (overlap > 0) {
          overtimeMinutes = Math.max(0, overtimeMinutes - overlap);
        }
      }
    }
  }

  return {
    totalMinutes,
    totalHours: Math.round(totalHours * 100) / 100,
    lunchBreakMinutes,
    workedHours: Math.round(workedHours * 100) / 100,
    overtimeMinutes,
    overtimeHours: Math.round((overtimeMinutes / 60) * 100) / 100,
  };
}

export function isLate(timeIn: Date | string, scheduledTime: string): boolean {
  const timeInDate = typeof timeIn === 'string' ? parseISO(timeIn) : timeIn;
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  
  const scheduled = new Date(timeInDate);
  scheduled.setHours(hours, minutes, 0, 0);
  
  return timeInDate > scheduled;
}

export function calculateLatenessMinutes(timeIn: Date | string, scheduledTime: string): number {
  const timeInDate = typeof timeIn === 'string' ? parseISO(timeIn) : timeIn;
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const scheduled = new Date(timeInDate);
  scheduled.setHours(hours, minutes, 0, 0);
  const mins = differenceInMinutes(timeInDate, scheduled);
  return mins > 0 ? mins : 0;
}

export function isEarlyOut(timeOut: Date | string, scheduledTime: string): boolean {
  const timeOutDate = typeof timeOut === 'string' ? parseISO(timeOut) : timeOut;
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  
  const scheduled = new Date(timeOutDate);
  scheduled.setHours(hours, minutes, 0, 0);
  
  return timeOutDate < scheduled;
}

export function calculateEarlyOutMinutes(timeOut: Date | string, scheduledTime: string): number {
  const timeOutDate = typeof timeOut === 'string' ? parseISO(timeOut) : timeOut;
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const scheduled = new Date(timeOutDate);
  scheduled.setHours(hours, minutes, 0, 0);
  const mins = differenceInMinutes(scheduled, timeOutDate);
  return mins > 0 ? mins : 0;
}

export function getTodayRange() {
  const now = getPhilippineTime();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}

export function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getCurrentDayOfWeek(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const phTime = getPhilippineTime();
  return days[phTime.getDay()];
}
