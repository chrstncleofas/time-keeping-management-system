/**
 * Generate employee ID in format: ibay-XXXX
 * where XXXX is a random 4-digit number
 */
export function generateEmployeeId(options?: { prefix?: string; padding?: number; delimiter?: string; uppercase?: boolean; } ): string {
  const prefix = options?.prefix ?? 'ibay';
  const padding = typeof options?.padding === 'number' ? options!.padding : 4;
  const delimiter = options?.delimiter ?? '-';
  const uppercase = options?.uppercase ?? false;

  const max = Math.pow(10, padding) - 1;
  const min = Math.pow(10, padding - 1);
  const rand = Math.floor(Math.random() * (max - min + 1)) + min;
  let id = `${prefix}${delimiter}${rand}`;
  if (uppercase) id = id.toUpperCase();
  return id;
}

/**
 * Check if employee ID is valid format
 */
export function isValidEmployeeId(employeeId: string, options?: { prefix?: string; padding?: number; delimiter?: string; uppercase?: boolean; }): boolean {
  const prefix = options?.prefix ?? 'ibay';
  const padding = typeof options?.padding === 'number' ? options!.padding : 4;
  const delimiter = options?.delimiter ?? '-';
  const escapedPrefix = prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const pattern = new RegExp(`^${escapedPrefix}${delimiter}\\d{${padding}}${options?.uppercase ? '$' : '$'}`);
  return pattern.test(employeeId);
}

/**
 * Calculate age from birthday
 */
export function calculateAge(birthday: Date): number {
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
