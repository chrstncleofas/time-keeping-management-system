#!/usr/bin/env node
/*
  scripts/patch_attendance.js

  Usage:
    node scripts/patch_attendance.js --mongoUri="mongodb://..." --start=2025-12-20 --end=2025-12-22
    OR
    node scripts/patch_attendance.js --mongoUri="mongodb://..." --id=<attendanceId>

  This script will recalculate `totalHours`, `lunchBreakMinutes`, `workedHours`, `lateMinutes`, and `earlyOutMinutes`
  for attendance documents and update them in the database. It uses schedule documents for each user to clamp
  time-in/time-out to scheduled hours and to compute lunch overlap when `lunchStart`/`lunchEnd` are present.
*/

const { MongoClient, ObjectId } = require('mongodb');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach(a => {
    const eq = a.indexOf('=');
    if (eq === -1) return;
    const k = a.slice(0, eq).replace(/^--/, '');
    const v = a.slice(eq + 1);
    out[k] = v;
  });
  return out;
}

function getDayName(date) {
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  return days[new Date(date).getDay()];
}

function toDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  return new Date(d);
}

function clampToSchedule(time, scheduleTime, referenceDate) {
  if (!scheduleTime) return time;
  const [h, m] = scheduleTime.split(':').map(Number);
  const sched = new Date(referenceDate);
  sched.setHours(h, m, 0, 0);
  if (time < sched) return sched;
  return time;
}

function clampOutToSchedule(time, scheduleTime, referenceDate) {
  if (!scheduleTime) return time;
  const [h, m] = scheduleTime.split(':').map(Number);
  const sched = new Date(referenceDate);
  sched.setHours(h, m, 0, 0);
  if (time > sched) return sched;
  return time;
}

function differenceInMinutes(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

function calculateDetailed({timeIn, timeOut, scheduleStart, scheduleEnd, lunchStart, lunchEnd}){
  // timeIn/timeOut expected Date
  let effectiveIn = new Date(timeIn);
  let effectiveOut = new Date(timeOut);

  if (scheduleStart) {
    const [sh, sm] = scheduleStart.split(':').map(Number);
    const schedStart = new Date(effectiveIn);
    schedStart.setHours(sh, sm, 0, 0);
    if (effectiveIn < schedStart) effectiveIn = schedStart;
  }

  if (scheduleEnd) {
    const [eh, em] = scheduleEnd.split(':').map(Number);
    const schedEnd = new Date(effectiveOut);
    schedEnd.setHours(eh, em, 0, 0);
    if (effectiveOut > schedEnd) effectiveOut = schedEnd;
  }

  let totalMinutes = differenceInMinutes(effectiveOut, effectiveIn);
  if (totalMinutes < 0) totalMinutes = 0;
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

  let lunchBreakMinutes = 0;
  if (lunchStart && lunchEnd) {
    const [lh, lm] = lunchStart.split(':').map(Number);
    const [leh, lem] = lunchEnd.split(':').map(Number);
    const lunchStartDate = new Date(effectiveIn);
    lunchStartDate.setHours(lh, lm, 0, 0);
    const lunchEndDate = new Date(effectiveIn);
    lunchEndDate.setHours(leh, lem, 0, 0);
    const overlapStart = effectiveIn > lunchStartDate ? effectiveIn : lunchStartDate;
    const overlapEnd = effectiveOut < lunchEndDate ? effectiveOut : lunchEndDate;
    const overlap = differenceInMinutes(overlapEnd, overlapStart);
    lunchBreakMinutes = overlap > 0 ? overlap : 0;
  } else {
    // DOLE fallback
    if (totalHours > 6) lunchBreakMinutes = 60;
    else if (totalHours >= 4) lunchBreakMinutes = 30;
  }

  const workedMinutes = Math.max(0, totalMinutes - lunchBreakMinutes);
  const workedHours = Math.round((workedMinutes / 60) * 100) / 100;

  return { totalMinutes, totalHours, lunchBreakMinutes, workedMinutes, workedHours };
}

function calculateLatenessMinutes(timeIn, scheduledTime) {
  if (!timeIn || !scheduledTime) return 0;
  const tin = new Date(timeIn);
  const scheduled = new Date(tin);
  const [h,m] = scheduledTime.split(':').map(Number);
  scheduled.setHours(h,m,0,0);
  const mins = differenceInMinutes(tin, scheduled);
  return mins > 0 ? mins : 0;
}

function calculateEarlyOutMinutes(timeOut, scheduledTime) {
  if (!timeOut || !scheduledTime) return 0;
  const tout = new Date(timeOut);
  const scheduled = new Date(tout);
  const [h,m] = scheduledTime.split(':').map(Number);
  scheduled.setHours(h,m,0,0);
  const mins = differenceInMinutes(scheduled, tout);
  return mins > 0 ? mins : 0;
}

async function run() {
  const args = parseArgs();
  const mongoUri = args.mongoUri || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing --mongoUri or MONGO_URI env var');
    process.exit(1);
  }
  // Basic validation: require mongodb:// or mongodb+srv:// prefix
  if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri)) {
    console.error('Invalid MongoDB URI. It must start with "mongodb://" or "mongodb+srv://".');
    console.error('Provided value (sanitized):', mongoUri.replace(/:[^@]+@/, ':*****@'));
    console.error('Example: --mongoUri="mongodb://username:password@host:27017/dbname"');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db();

  const attendances = db.collection('attendances');
  const schedules = db.collection('schedules');

  let cursor;
  if (args.id) {
    cursor = attendances.find({ _id: new ObjectId(args.id) });
  } else if (args.start && args.end) {
    const start = new Date(args.start);
    const end = new Date(args.end);
    // assume attendance.date stored as Date at startOfDay
    cursor = attendances.find({ date: { $gte: start, $lte: end } });
  } else {
    console.error('Provide --id or --start and --end');
    await client.close();
    process.exit(1);
  }

  let count = 0;
  while (await cursor.hasNext()) {
    const att = await cursor.next();
    count++;
    try {
      const dayName = getDayName(att.date || att._id.getTimestamp());
      const schedule = await schedules.findOne({ userId: att.userId, days: dayName, isActive: true });

      const timeInTs = att.timeIn && att.timeIn.timestamp ? new Date(att.timeIn.timestamp) : null;
      const timeOutTs = att.timeOut && att.timeOut.timestamp ? new Date(att.timeOut.timestamp) : null;

      if (!timeInTs || !timeOutTs) {
        console.log(`Skipping ${att._id} (missing timeIn or timeOut)`);
        continue;
      }

      const scheduleStart = schedule ? schedule.timeIn : null;
      const scheduleEnd = schedule ? schedule.timeOut : null;
      const lunchStart = schedule ? schedule.lunchStart : null;
      const lunchEnd = schedule ? schedule.lunchEnd : null;

      const details = calculateDetailed({ timeIn: timeInTs, timeOut: timeOutTs, scheduleStart, scheduleEnd, lunchStart, lunchEnd });
      const lateMinutes = calculateLatenessMinutes(timeInTs, scheduleStart);
      const earlyOutMinutes = calculateEarlyOutMinutes(timeOutTs, scheduleEnd);

      const update = {
        totalHours: details.totalHours,
        lunchBreakMinutes: details.lunchBreakMinutes,
        workedHours: details.workedHours,
        lateMinutes,
        earlyOutMinutes,
        isLate: lateMinutes > 0,
        isEarlyOut: earlyOutMinutes > 0,
      };

      await attendances.updateOne({ _id: att._id }, { $set: update });
      console.log(`Updated ${att._id}: workedHours=${details.workedHours} lunch=${details.lunchBreakMinutes} late=${lateMinutes} earlyOut=${earlyOutMinutes}`);
    } catch (err) {
      console.error('Error processing', att._id, err);
    }
  }

  console.log(`Processed ${count} attendance records.`);
  await client.close();
}

run().catch(err => { console.error(err); process.exit(1); });
