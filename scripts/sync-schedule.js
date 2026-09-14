#!/usr/bin/env node
// One-time (or repeatable) sync: pushes this trip's authoritative schedule rows
// (server/data/trip.js DAYS[i].rows) to a *live, already-deployed* copy of this
// app, replacing whatever schedule rows are currently in its database for the
// given day(s).
//
// Why this exists: trip.js's static fields (intro, alert, notes, sites, etc.)
// are read fresh on every request, so a normal deploy updates them for
// everyone automatically. But schedule rows are seeded into the database only
// once and then treated as user-editable data from then on — a deploy alone
// never touches them. Run this after updating trip.js's rows for a day and
// wanting that reflected on a deployment that's already past its first boot.
//
// This deletes and recreates every row for the given day(s), which also
// deletes any posts (photo/notes) attached to those specific rows — fine for
// pushing corrected reservation times before the trip, but check with
// whoever's using the live app first if it's already in daily use.
//
// Usage:
//   node scripts/sync-schedule.js <base-url> <dayIndex> [dayIndex...]
// Example:
//   node scripts/sync-schedule.js https://honolulu-agzd.onrender.com 1 2 4
//   (dayIndex is 0-based: 0=Mon Oct 12 ... 4=Fri Oct 16)

const { DAYS } = require('../server/data/trip');

const [, , baseUrlArg, ...dayArgs] = process.argv;
if (!baseUrlArg || dayArgs.length === 0) {
  console.error('Usage: node scripts/sync-schedule.js <base-url> <dayIndex> [dayIndex...]');
  console.error('Example: node scripts/sync-schedule.js https://honolulu-agzd.onrender.com 1 2 4');
  process.exit(1);
}
if (typeof fetch !== 'function') {
  console.error('This script needs Node 18+ (for built-in fetch). Check your Node version with: node --version');
  process.exit(1);
}

const baseUrl = baseUrlArg.replace(/\/$/, '');
const dayIndexes = dayArgs.map(Number);

async function syncDay(dayIndex) {
  const day = DAYS[dayIndex];
  if (!day) throw new Error('No such day index: ' + dayIndex + ' (trip.js has ' + DAYS.length + ' days, 0-indexed)');
  console.log(`\nDay ${dayIndex} — ${day.title} (${day.dow} ${day.date}):`);

  const existingRes = await fetch(`${baseUrl}/api/schedule/${dayIndex}`);
  if (!existingRes.ok) throw new Error(`GET /api/schedule/${dayIndex} failed: ${existingRes.status}`);
  const existing = await existingRes.json();

  for (const row of existing) {
    const delRes = await fetch(`${baseUrl}/api/schedule-items/${row.id}`, { method: 'DELETE' });
    if (!delRes.ok) throw new Error(`DELETE schedule-items/${row.id} failed: ${delRes.status}`);
    console.log(`  removed: ${row.time} — ${row.what}`);
  }

  for (const row of day.rows) {
    const res = await fetch(`${baseUrl}/api/schedule/${dayIndex}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: row.time, what: row.what, where: row.where, hi: !!row.hi, link: row.link || '' })
    });
    if (!res.ok) throw new Error(`POST /api/schedule/${dayIndex} failed: ${res.status}`);
    const created = await res.json();
    console.log(`  added:   ${created.time} — ${created.what}`);
  }
}

(async () => {
  try {
    for (const dayIndex of dayIndexes) {
      await syncDay(dayIndex);
    }
    console.log('\nDone — reload the app to see the updated schedule.');
  } catch (err) {
    console.error('\nSync failed:', err.message);
    process.exit(1);
  }
})();
