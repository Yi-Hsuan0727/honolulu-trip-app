const path = require('path');
const Database = require('better-sqlite3');
const { DAYS, PREP } = require('./data/trip');

const db = new Database(path.join(__dirname, 'trip.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS schedule_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_key INTEGER NOT NULL,
  position INTEGER NOT NULL,
  time TEXT NOT NULL DEFAULT '',
  what TEXT NOT NULL DEFAULT '',
  where_text TEXT NOT NULL DEFAULT '',
  highlight INTEGER NOT NULL DEFAULT 0,
  link TEXT
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_item_id INTEGER NOT NULL REFERENCES schedule_items(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  image_path TEXT
);

CREATE TABLE IF NOT EXISTS prep_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_index INTEGER NOT NULL,
  position INTEGER NOT NULL,
  label TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0
);
`);

// Migration: add columns introduced after a database may have already been
// created (CREATE TABLE IF NOT EXISTS above only affects brand-new tables).
function migrate() {
  const columns = db.prepare("PRAGMA table_info(schedule_items)").all().map(c => c.name);
  if (!columns.includes('link')) {
    db.exec('ALTER TABLE schedule_items ADD COLUMN link TEXT');
  }
}
migrate();

function seedIfEmpty() {
  const scheduleCount = db.prepare('SELECT COUNT(*) AS n FROM schedule_items').get().n;
  if (scheduleCount === 0) {
    const insert = db.prepare('INSERT INTO schedule_items (day_key, position, time, what, where_text, highlight, link) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const tx = db.transaction(() => {
      DAYS.forEach((day, dayKey) => {
        day.rows.forEach((row, i) => {
          insert.run(dayKey, i, row.time, row.what, row.where, row.hi ? 1 : 0, row.link || null);
        });
      });
    });
    tx();
  }

  const prepCount = db.prepare('SELECT COUNT(*) AS n FROM prep_items').get().n;
  if (prepCount === 0) {
    const insert = db.prepare('INSERT INTO prep_items (group_index, position, label, done) VALUES (?, ?, ?, 0)');
    const tx = db.transaction(() => {
      PREP.forEach((group, gi) => {
        group.items.forEach((label, i) => insert.run(gi, i, label));
      });
    });
    tx();
  }
}

seedIfEmpty();

module.exports = db;
