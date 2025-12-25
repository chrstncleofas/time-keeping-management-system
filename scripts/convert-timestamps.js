// scripts/convert-timestamps.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local if present (Next.js style), otherwise fall back to .env
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
} else {
  dotenv.config();
}

const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
let dbName = process.env.MONGO_DB_NAME || process.env.MONGODB_DB || process.env.MONGO_DB || null;
// If DB name not explicitly provided, try to parse it from the connection string (e.g. /tkms?...) 
if (!dbName && uri) {
  const m = uri.match(/\/([^\/?]+)(?:\?|$)/);
  if (m) dbName = m[1];
}

if (!uri) {
  console.error('Missing MONGO_URI. Set environment variable MONGO_URI to your connection string.');
  process.exit(1);
}
if (!dbName) {
  console.error('Missing MONGO_DB_NAME. Set environment variable MONGO_DB_NAME to the database name (e.g., tkms).');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
// if --ph-fields provided, script will write non-destructive ph fields instead of mutating originals
const phFields = process.argv.includes('--ph-fields');
const batchMode = process.argv.includes('--batch');
const applyUpdates = process.argv.includes('--apply'); // must be set to actually apply changes in batch mode
const force = process.argv.includes('--force'); // overwrite existing ph fields or timestamps

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const batchSize = parseInt(getArgValue('--batch-size') || '200', 10);
const client = new MongoClient(uri, { maxPoolSize: 10 });

async function run() {
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection('attendances');

  // preview one doc id passed via env or default sample id
  const sampleId = process.env.SAMPLE_ID || '694c8ed36de36b3996a7ceba';
  const id = new ObjectId(sampleId);
  const doc = await col.findOne({ _id: id });
  if (!doc) {
    console.error('Document not found for _id', sampleId);
    await client.close();
    process.exit(1);
  }

  console.log('Original timestamps (UTC):');
  console.log(' timeIn:', doc.timeIn?.timestamp);
  console.log(' timeOut:', doc.timeOut?.timestamp);
  console.log(' createdAt:', doc.createdAt);

  // transform in JS (add 8 hours)
  const addHours = (d, h = 8) => (d ? new Date(new Date(d).getTime() + h * 3600 * 1000) : null);

  const timeInNew = addHours(doc.timeIn?.timestamp, 8);
  const timeOutNew = addHours(doc.timeOut?.timestamp, 8);
  const createdAtNew = addHours(doc.createdAt, 8);
  const updatedAtNew = addHours(doc.updatedAt, 8);
  // dateNew as local PH date (00:00 at that PH day stored as UTC midnight)
  const dateNew = timeInNew
    ? new Date(Date.UTC(timeInNew.getFullYear(), timeInNew.getMonth(), timeInNew.getDate()))
    : null;

  console.log('\nPreview converted values (Asia/Manila equivalent):');
  console.log(' timeIn (PH):', timeInNew);
  console.log(' timeOut (PH):', timeOutNew);
  console.log(' createdAt (PH):', createdAtNew);
  console.log(' date (PH day UTC midnight):', dateNew);

  if (dryRun) {
    console.log('\nDry-run mode — no changes applied.');
    await client.close();
    return;
  }

  // Build update depending on mode
  let update;
  if (phFields) {
    update = {
      $set: {
        ...(timeInNew && { 'timeIn.phTimestamp': timeInNew }),
        ...(timeOutNew && { 'timeOut.phTimestamp': timeOutNew }),
        ...(createdAtNew && { createdAt_ph: createdAtNew }),
        ...(dateNew && { date_ph: dateNew }),
      },
    };
  } else {
    update = {
      $set: {
        ...(timeInNew && { 'timeIn.timestamp': timeInNew }),
        ...(timeOutNew && { 'timeOut.timestamp': timeOutNew }),
        ...(createdAtNew && { createdAt: createdAtNew }),
        ...(updatedAtNew && { updatedAt: updatedAtNew }),
        ...(dateNew && { date: dateNew }),
      },
    };
  }

  const res = await col.updateOne({ _id: id }, update);
  console.log('Update acknowledged:', res.acknowledged, 'modifiedCount:', res.modifiedCount);

  console.log('Done — updated document', sampleId);
  await client.close();
}

async function processBatch() {
  console.log('Starting batch mode. batchSize=', batchSize, 'apply=', applyUpdates, 'phFields=', phFields, 'force=', force);
  const db = client.db(dbName);
  const col = db.collection('attendances');
  const query = {}; // TODO: could be customized via env/query arg
  const cursor = col.find(query).batchSize(batchSize);
  let processed = 0;
  let toBulk = [];

  while (await cursor.hasNext()) {
    const d = await cursor.next();
    // compute PH-shifted values
    const addHours = (dd, h = 8) => (dd ? new Date(new Date(dd).getTime() + h * 3600 * 1000) : null);
    const timeInNew = addHours(d.timeIn?.timestamp, 8);
    const timeOutNew = addHours(d.timeOut?.timestamp, 8);
    const createdAtNew = addHours(d.createdAt, 8);
    const updatedAtNew = addHours(d.updatedAt, 8);
    const dateNew = timeInNew ? new Date(Date.UTC(timeInNew.getFullYear(), timeInNew.getMonth(), timeInNew.getDate())) : null;

    // skip if already has ph fields and not forced
    if (!force && (d.timeIn?.phTimestamp || d.timeOut?.phTimestamp || d.date_ph)) {
      processed++;
      continue;
    }

    let upd;
    if (phFields) {
      upd = { $set: {
        ...(timeInNew && { 'timeIn.phTimestamp': timeInNew }),
        ...(timeOutNew && { 'timeOut.phTimestamp': timeOutNew }),
        ...(createdAtNew && { createdAt_ph: createdAtNew }),
        ...(dateNew && { date_ph: dateNew }),
      } };
    } else {
      upd = { $set: {
        ...(timeInNew && { 'timeIn.timestamp': timeInNew }),
        ...(timeOutNew && { 'timeOut.timestamp': timeOutNew }),
        ...(createdAtNew && { createdAt: createdAtNew }),
        ...(updatedAtNew && { updatedAt: updatedAtNew }),
        ...(dateNew && { date: dateNew }),
      } };
    }

    toBulk.push({ updateOne: { filter: { _id: d._id }, update: upd } });
    processed++;

    if (toBulk.length >= batchSize) {
      console.log('Processing bulk of', toBulk.length, 'documents...');
      if (applyUpdates) {
        const r = await col.bulkWrite(toBulk, { ordered: false });
        console.log('Bulk write result:', r);
      } else {
        console.log('Dry-run: skipping applying bulk write.');
      }
      toBulk = [];
    }
  }

  if (toBulk.length > 0) {
    console.log('Processing final bulk of', toBulk.length, 'documents...');
    if (applyUpdates) {
      const r = await col.bulkWrite(toBulk, { ordered: false });
      console.log('Bulk write result:', r);
    } else {
      console.log('Dry-run: skipping final bulk write.');
    }
  }

  console.log('Batch processing finished. Processed count:', processed);
}

run().catch((err) => {
  console.error('Error during conversion (single):', err);
  process.exit(1);
});

// If batch flag provided, run batch after ensuring connection
(async () => {
  if (batchMode) {
    try {
      await client.connect();
      await processBatch();
    } catch (err) {
      console.error('Error during batch processing:', err);
    } finally {
      await client.close();
    }
  }
})();