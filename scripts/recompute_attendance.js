#!/usr/bin/env node
/*
  Recompute attendance lateness based on current schedules.

  Usage:
    node scripts/recompute_attendance.js --userId <userId> [--start YYYY-MM-DD] [--end YYYY-MM-DD]
    node scripts/recompute_attendance.js --all --start YYYY-MM-DD --end YYYY-MM-DD

  If neither --start/--end provided, defaults to last 7 days.
*/

const mongoose = require('mongoose');
const { differenceInMinutes, startOfDay, endOfDay } = require('date-fns');

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || true;
}

const userId = getArg('--userId');
const allFlag = process.argv.includes('--all');
const startArg = getArg('--start');
const endArg = getArg('--end');
const mongoFlag = getArg('--mongo');
const dryRunFlag = process.argv.includes('--dry-run');

// Allow explicit mongo URI via --mongo, then env var, then default local
const MONGODB_URI = mongoFlag || process.env.MONGODB_URI || 'mongodb://localhost:27017/tkms';

async function main() {
  console.log('Connecting to', MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB.');
    console.error(err.message || err);
    console.error('If you provided an Atlas URI ensure your network/DNS allows SRV lookups.');
    console.error('You can also run a local MongoDB (docker or mongod) and omit --mongo.');
    process.exit(1);
  }

  const Attendance = mongoose.connection.collection('attendances');
  const Schedules = mongoose.connection.collection('schedules');

  let startDate, endDate;
  if (startArg) startDate = startOfDay(new Date(startArg));
  if (endArg) endDate = endOfDay(new Date(endArg));
  if (!startDate || !endDate) {
    // default to last 7 days
    const now = new Date();
    endDate = endDate || endOfDay(now);
    const past = new Date(now);
    past.setDate(past.getDate() - 7);
    startDate = startDate || startOfDay(past);
  }

  const filter = {
    date: { $gte: startDate, $lte: endDate },
  };
  if (!allFlag && userId) filter.userId = userId;

  console.log('Querying attendances with filter', JSON.stringify(filter));
  if (dryRunFlag) console.log('Running in dry-run mode — no writes will be performed');

  const cursor = Attendance.find(filter);
  let count = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    count++;
    const attDate = new Date(doc.date);
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const dayName = dayNames[attDate.getDay()];

    // find latest active schedule for user on this day
    const schedule = await Schedules.find({ userId: doc.userId, days: dayName, isActive: true }).sort({ updatedAt: -1 }).limit(1).toArray();
    const sched = schedule && schedule[0];
    if (!sched) {
      console.log(`Skipping attendance ${doc._id} — no schedule for user ${doc.userId} on ${dayName}`);
      continue;
    }

    if (!doc.timeIn || !doc.timeIn.timestamp) {
      console.log(`Skipping attendance ${doc._id} — no timeIn`);
      continue;
    }

    const timeInDate = new Date(doc.timeIn.timestamp);
    const [sh, sm] = (sched.timeIn || '00:00').split(':').map(Number);
    const scheduled = new Date(timeInDate);
    scheduled.setHours(sh, sm, 0, 0);

    const isLate = timeInDate > scheduled;
    const lateMinutes = isLate ? Math.max(0, differenceInMinutes(timeInDate, scheduled)) : 0;

    const update = {
      isLate,
      lateMinutes,
    };

    if (dryRunFlag) {
      console.log(`[dry-run] Would update attendance ${doc._id} for user ${doc.userId}: isLate=${isLate}, lateMinutes=${lateMinutes}`);
    } else {
      await Attendance.updateOne({ _id: doc._id }, { $set: update });
      console.log(`Updated attendance ${doc._id} for user ${doc.userId}: isLate=${isLate}, lateMinutes=${lateMinutes}`);
    }
  }

  console.log(`Processed ${count} attendance records`);
  await mongoose.disconnect();
  console.log('Done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
