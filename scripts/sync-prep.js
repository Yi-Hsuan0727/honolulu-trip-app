#!/usr/bin/env node
// Same idea as sync-schedule.js, but for the Prep checklist: pushes this
// trip's authoritative to-do items (server/data/trip.js PREP[i].items) to a
// *live, already-deployed* copy of this app, replacing whatever items are
// currently in its database for the given group(s). A normal deploy alone
// never touches this — the checklist is seeded once, then treated as
// user-editable data.
//
// This deletes every item in the given group(s) and recreates them from
// trip.js, so any done/checked state on those specific items is lost (a
// fresh item starts unchecked). Fine for pushing wording changes; check with
// whoever's using the live app if they've already been ticking things off in
// that group.
//
// Usage:
//   node scripts/sync-prep.js <base-url> <groupIndex> [groupIndex...]
// Example:
//   node scripts/sync-prep.js https://honolulu-agzd.onrender.com 0
//   (groupIndex is 0-based: 0=Do this first, 1=Then, 2=Pack, 3=Water days, 4=Leave at home)

const { PREP } = require('../server/data/trip');

const [, , baseUrlArg, ...groupArgs] = process.argv;
if (!baseUrlArg || groupArgs.length === 0) {
  console.error('Usage: node scripts/sync-prep.js <base-url> <groupIndex> [groupIndex...]');
  console.error('Example: node scripts/sync-prep.js https://honolulu-agzd.onrender.com 0');
  process.exit(1);
}
if (typeof fetch !== 'function') {
  console.error('This script needs Node 18+ (for built-in fetch). Check your Node version with: node --version');
  process.exit(1);
}

const baseUrl = baseUrlArg.replace(/\/$/, '');
const groupIndexes = groupArgs.map(Number);

async function syncGroup(groupIndex) {
  const group = PREP[groupIndex];
  if (!group) throw new Error('No such group index: ' + groupIndex + ' (trip.js has ' + PREP.length + ' groups, 0-indexed)');
  console.log(`\nGroup ${groupIndex} — ${group.title}:`);

  const allRes = await fetch(`${baseUrl}/api/prep`);
  if (!allRes.ok) throw new Error(`GET /api/prep failed: ${allRes.status}`);
  const allGroups = await allRes.json();
  const existing = allGroups[groupIndex]?.items || [];

  for (const item of existing) {
    const delRes = await fetch(`${baseUrl}/api/prep-items/${item.id}`, { method: 'DELETE' });
    if (!delRes.ok) throw new Error(`DELETE prep-items/${item.id} failed: ${delRes.status}`);
    console.log(`  removed: ${item.label}`);
  }

  for (const label of group.items) {
    const res = await fetch(`${baseUrl}/api/prep/${groupIndex}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label })
    });
    if (!res.ok) throw new Error(`POST /api/prep/${groupIndex}/items failed: ${res.status}`);
    const created = await res.json();
    console.log(`  added:   ${created.label}`);
  }
}

(async () => {
  try {
    for (const groupIndex of groupIndexes) {
      await syncGroup(groupIndex);
    }
    console.log('\nDone — reload the app to see the updated checklist.');
  } catch (err) {
    console.error('\nSync failed:', err.message);
    process.exit(1);
  }
})();
