import connectDB from '@/lib/db/mongodb';
import Absence from '@/lib/models/Absence';

export async function findAbsences({ user, userId }: { user: any; userId?: string } ) {
  await connectDB();
  if (user.role === 'admin' || user.role === 'super-admin') {
    const query: any = {};
    if (userId) query.userId = userId;
    return Absence.find(query).sort({ date: -1 });
  }
  return Absence.find({ userId: user._id }).sort({ date: -1 });
}

export async function createAbsence(payload: any, markedBy: string) {
  await connectDB();
  const { userId, date, reason, notes } = payload;
  const existing = await Absence.findOne({ userId, date: new Date(date) });
  if (existing) throw new Error('Absence already marked for this date');
  const absence = await Absence.create({ userId, date: new Date(date), reason, notes, markedBy });
  return absence;
}
