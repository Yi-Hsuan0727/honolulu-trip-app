const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 10);
    cb(null, crypto.randomBytes(16).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});

const router = express.Router();

function rowWithPosts(item) {
  const posts = db.prepare('SELECT * FROM posts WHERE schedule_item_id = ? ORDER BY position ASC').all(item.id);
  return {
    id: item.id, time: item.time, what: item.what, where: item.where_text, hi: !!item.highlight,
    posts: posts.map(p => ({ id: p.id, text: p.text, imagePath: p.image_path }))
  };
}

router.get('/schedule/:dayKey', (req, res) => {
  const dayKey = Number(req.params.dayKey);
  const items = db.prepare('SELECT * FROM schedule_items WHERE day_key = ? ORDER BY position ASC').all(dayKey);
  res.json(items.map(rowWithPosts));
});

router.post('/schedule/:dayKey', (req, res) => {
  const dayKey = Number(req.params.dayKey);
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM schedule_items WHERE day_key = ?').get(dayKey).m;
  const { time = '', what = 'New item', where = '', hi = false } = req.body || {};
  const info = db.prepare('INSERT INTO schedule_items (day_key, position, time, what, where_text, highlight) VALUES (?, ?, ?, ?, ?, ?)')
    .run(dayKey, maxPos + 1, time, what, where, hi ? 1 : 0);
  const item = db.prepare('SELECT * FROM schedule_items WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(rowWithPosts(item));
});

router.put('/schedule/:dayKey/reorder', (req, res) => {
  const dayKey = Number(req.params.dayKey);
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
  const update = db.prepare('UPDATE schedule_items SET position = ? WHERE id = ? AND day_key = ?');
  const tx = db.transaction(() => order.forEach((id, i) => update.run(i, id, dayKey)));
  tx();
  res.json({ ok: true });
});

router.put('/schedule-items/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM schedule_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const time = req.body.time !== undefined ? req.body.time : existing.time;
  const what = req.body.what !== undefined ? req.body.what : existing.what;
  const where = req.body.where !== undefined ? req.body.where : existing.where_text;
  const highlight = req.body.hi !== undefined ? (req.body.hi ? 1 : 0) : existing.highlight;
  db.prepare('UPDATE schedule_items SET time = ?, what = ?, where_text = ?, highlight = ? WHERE id = ?').run(time, what, where, highlight, id);
  res.json(rowWithPosts(db.prepare('SELECT * FROM schedule_items WHERE id = ?').get(id)));
});

router.delete('/schedule-items/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = db.prepare('SELECT * FROM schedule_items WHERE id = ?').get(id);
  if (item) {
    const posts = db.prepare('SELECT image_path FROM posts WHERE schedule_item_id = ?').all(id);
    posts.forEach(p => removeUpload(p.image_path));
  }
  db.prepare('DELETE FROM schedule_items WHERE id = ?').run(id);
  res.json({ ok: true });
});

function removeUpload(imagePath) {
  if (!imagePath) return;
  const full = path.join(uploadsDir, path.basename(imagePath));
  fs.unlink(full, () => {});
}

router.post('/schedule-items/:id/posts', upload.single('image'), (req, res) => {
  const id = Number(req.params.id);
  const item = db.prepare('SELECT * FROM schedule_items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'not found' });
  const count = db.prepare('SELECT COUNT(*) AS n FROM posts WHERE schedule_item_id = ?').get(id).n;
  if (count >= 3) return res.status(400).json({ error: 'a schedule item can only have 3 posts' });
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM posts WHERE schedule_item_id = ?').get(id).m;
  const imagePath = req.file ? '/uploads/' + req.file.filename : null;
  const text = req.body.text || '';
  const info = db.prepare('INSERT INTO posts (schedule_item_id, position, text, image_path) VALUES (?, ?, ?, ?)')
    .run(id, maxPos + 1, text, imagePath);
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ id: post.id, text: post.text, imagePath: post.image_path });
});

router.put('/posts/:id', upload.single('image'), (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const text = req.body.text !== undefined ? req.body.text : existing.text;
  let imagePath = existing.image_path;
  if (req.file) {
    removeUpload(existing.image_path);
    imagePath = '/uploads/' + req.file.filename;
  }
  db.prepare('UPDATE posts SET text = ?, image_path = ? WHERE id = ?').run(text, imagePath, id);
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  res.json({ id: post.id, text: post.text, imagePath: post.image_path });
});

router.delete('/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  if (post) removeUpload(post.image_path);
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
