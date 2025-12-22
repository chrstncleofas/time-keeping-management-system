import connectDB from '@/lib/db/mongodb';
import TimeAdjustment from '@/lib/models/TimeAdjustment';
import SystemSettings from '@/lib/models/SystemSettings';

const SETTINGS_ID = '000000000000000000000001';

export async function findAdjustments() {
  await connectDB();
  const adjustments = await TimeAdjustment.find().populate('userId', 'firstName lastName employeeId').populate('approvedBy', 'firstName lastName').sort({ createdAt: -1 });
  return adjustments;
}

export async function createAdjustment(payload: any, approvedBy: string) {
  await connectDB();
  const settings = await SystemSettings.findById(SETTINGS_ID);
  if (!settings?.enableVerbalAgreements) throw new Error('Manual time adjustments are currently disabled');

  const { userId, adjustmentType, adjustedTime, date, reason, notes, originalTime } = payload;

  if (adjustmentType === 'early-out' && !settings.allowEarlyOut) throw new Error('Early out adjustments are disabled');
  if (adjustmentType === 'half-day' && !settings.allowHalfDay) throw new Error('Half day adjustments are disabled');
  if (adjustmentType === 'late-in' && !settings.allowLateIn) throw new Error('Late in adjustments are disabled');

  const adjustedDateTime = adjustedTime ? new Date(`${date}T${adjustedTime}`) : undefined;
  const originalDateTime = originalTime ? new Date(`${date}T${originalTime}`) : undefined;

  const adjustment = await TimeAdjustment.create({ userId, adjustmentType, originalTime: originalDateTime, adjustedTime: adjustedDateTime, date: new Date(date), reason, notes, approvedBy, status: 'approved' });

  const populated = await TimeAdjustment.findById(adjustment._id).populate('userId', 'firstName lastName employeeId').populate('approvedBy', 'firstName lastName');
  return populated;
}
