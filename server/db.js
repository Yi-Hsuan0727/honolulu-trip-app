const { createClient } = require('@libsql/client');
const { DAYS, PREP } = require('./data/trip');

// Turso (or any libSQL-compatible URL) in production; falls back to a local
// file for development/testing so this works without cloud credentials.
// This lives on Turso — not the app server's own disk — specifically because
// free hosting tiers (e.g. Render's free plan) don't guarantee local disk
// survives a restart, which happens automatically and often. A database that
// lives somewhere else survives that regardless of what happens to the app
// server itself.
const url = process.env.TURSO_DATABASE_URL || 'file:' + require('path').join(__dirname, 'trip.local.db');
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!process.env.TURSO_DATABASE_URL) {
  // Loud on purpose: this fallback is meant for local development only. If a
  // deployed instance ever hits this, it's silently back to storing data on
  // disk that the host can wipe on restart — the exact bug this file exists
  // to prevent — so make sure it shows up in the hosting platform's logs.
  console.warn(
    '\n*** TURSO_DATABASE_URL is not set — using a local SQLite file instead. ***\n' +
    'This is expected for local development. If you are seeing this in a deployed\n' +
    "environment's logs, set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN there — otherwise\n" +
    'data will not survive the host restarting this service.\n'
  );
}

const client = createClient(authToken ? { url, authToken } : { url });

async function execute(sql, args) {
  await ready;
  return client.execute(args !== undefined ? { sql, args } : sql);
}

async function init() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS schedule_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_key INTEGER NOT NULL,
      position INTEGER NOT NULL,
      time TEXT NOT NULL DEFAULT '',
      what TEXT NOT NULL DEFAULT '',
      where_text TEXT NOT NULL DEFAULT '',
      highlight INTEGER NOT NULL DEFAULT 0,
      link TEXT
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_item_id INTEGER NOT NULL REFERENCES schedule_items(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      image_data BLOB,
      image_mime TEXT
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS prep_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_index INTEGER NOT NULL,
      position INTEGER NOT NULL,
      label TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0
    )
  `);

  const scheduleCount = Number((await client.execute('SELECT COUNT(*) AS n FROM schedule_items')).rows[0].n);
  if (scheduleCount === 0) {
    for (const [dayKey, day] of DAYS.entries()) {
      for (const [i, row] of day.rows.entries()) {
        await client.execute({
          sql: 'INSERT INTO schedule_items (day_key, position, time, what, where_text, highlight, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: [dayKey, i, row.time, row.what, row.where, row.hi ? 1 : 0, row.link || null]
        });
      }
    }
  }

  const prepCount = Number((await client.execute('SELECT COUNT(*) AS n FROM prep_items')).rows[0].n);
  if (prepCount === 0) {
    for (const [gi, group] of PREP.entries()) {
      for (const [i, label] of group.items.entries()) {
        await client.execute({
          sql: 'INSERT INTO prep_items (group_index, position, label, done) VALUES (?, ?, ?, 0)',
          args: [gi, i, label]
        });
      }
    }
  }
}

const ready = init();
ready.catch((err) => console.error('Database init failed:', err.message));

module.exports = { client, execute, ready };
