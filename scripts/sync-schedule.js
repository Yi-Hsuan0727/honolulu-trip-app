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
// This UPDATES existing rows in place (matched by position/order) rather than
// deleting and recreating them, specifically so any posts (photo + note)
// already attached to those rows are preserved — deleting a row cascades to
// its posts. Only a genuine row-count change adds or removes rows (and only
// the removed ones lose their posts).
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
  const newRows = day.rows;

  const shared = Math.min(existing.length, newRows.length);

  for (let i = 0; i < shared; i++) {
    const row = newRows[i];
    const target = existing[i];
    const hasPosts = target.posts && target.posts.length;
    const res = await fetch(`${baseUrl}/api/schedule-items/${target.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: row.time, what: row.what, where: row.where, hi: !!row.hi, link: row.link || '' })
    });
    if (!res.ok) throw new Error(`PUT schedule-items/${target.id} failed: ${res.status}`);
    console.log(`  updated: ${row.time} — ${row.what}${hasPosts ? '  (kept ' + target.posts.length + ' post(s) attached)' : ''}`);
  }

  // existing has more rows than the new list — the extras are gone from the
  // itinerary, so remove them (this does lose any posts attached to *these*
  // specific rows, unlike the update path above)
  for (let i = shared; i < existing.length; i++) {
    const target = existing[i];
    const delRes = await fetch(`${baseUrl}/api/schedule-items/${target.id}`, { method: 'DELETE' });
    if (!delRes.ok) throw new Error(`DELETE schedule-items/${target.id} failed: ${delRes.status}`);
    const hadPosts = target.posts && target.posts.length;
    console.log(`  removed: ${target.time} — ${target.what}${hadPosts ? '  (also removed ' + target.posts.length + ' post(s) attached to it)' : ''}`);
  }

  // new list has more rows than existing — append the extras
  for (let i = shared; i < newRows.length; i++) {
    const row = newRows[i];
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
