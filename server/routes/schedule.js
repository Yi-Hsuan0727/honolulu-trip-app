const express = require('express');
const multer = require('multer');
const db = require('../db');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});

const router = express.Router();

async function rowWithPosts(item) {
  const postsRes = await db.execute('SELECT id, text, image_mime FROM posts WHERE schedule_item_id = ? ORDER BY position ASC', [item.id]);
  return {
    id: item.id, time: item.time, what: item.what, where: item.where_text, hi: !!item.highlight, link: item.link || '',
    posts: postsRes.rows.map(p => ({ id: p.id, text: p.text, imagePath: p.image_mime ? `/api/posts/${p.id}/image` : null }))
  };
}

router.get('/schedule/:dayKey', async (req, res, next) => {
  try {
    const dayKey = Number(req.params.dayKey);
    const items = (await db.execute('SELECT * FROM schedule_items WHERE day_key = ? ORDER BY position ASC', [dayKey])).rows;
    res.json(await Promise.all(items.map(rowWithPosts)));
  } catch (err) { next(err); }
});

router.post('/schedule/:dayKey', async (req, res, next) => {
  try {
    const dayKey = Number(req.params.dayKey);
    const maxPos = Number((await db.execute('SELECT COALESCE(MAX(position), -1) AS m FROM schedule_items WHERE day_key = ?', [dayKey])).rows[0].m);
    const { time = '', what = 'New item', where = '', hi = false, link = '' } = req.body || {};
    const info = await db.execute(
      'INSERT INTO schedule_items (day_key, position, time, what, where_text, highlight, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [dayKey, maxPos + 1, time, what, where, hi ? 1 : 0, link || null]
    );
    const item = (await db.execute('SELECT * FROM schedule_items WHERE id = ?', [Number(info.lastInsertRowid)])).rows[0];
    res.status(201).json(await rowWithPosts(item));
  } catch (err) { next(err); }
});

router.put('/schedule/:dayKey/reorder', async (req, res, next) => {
  try {
    const dayKey = Number(req.params.dayKey);
    const { order } = req.body || {};
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
    for (let i = 0; i < order.length; i++) {
      await db.execute('UPDATE schedule_items SET position = ? WHERE id = ? AND day_key = ?', [i, order[i], dayKey]);
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.put('/schedule-items/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = (await db.execute('SELECT * FROM schedule_items WHERE id = ?', [id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'not found' });
    const time = req.body.time !== undefined ? req.body.time : existing.time;
    const what = req.body.what !== undefined ? req.body.what : existing.what;
    const where = req.body.where !== undefined ? req.body.where : existing.where_text;
    const highlight = req.body.hi !== undefined ? (req.body.hi ? 1 : 0) : existing.highlight;
    const link = req.body.link !== undefined ? (req.body.link || null) : existing.link;
    await db.execute('UPDATE schedule_items SET time = ?, what = ?, where_text = ?, highlight = ?, link = ? WHERE id = ?', [time, what, where, highlight, link, id]);
    const item = (await db.execute('SELECT * FROM schedule_items WHERE id = ?', [id])).rows[0];
    res.json(await rowWithPosts(item));
  } catch (err) { next(err); }
});

router.delete('/schedule-items/:id', async (req, res, next) => {
  try {
    await db.execute('DELETE FROM schedule_items WHERE id = ?', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/schedule-items/:id/posts', upload.single('image'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const item = (await db.execute('SELECT * FROM schedule_items WHERE id = ?', [id])).rows[0];
    if (!item) return res.status(404).json({ error: 'not found' });
    const count = Number((await db.execute('SELECT COUNT(*) AS n FROM posts WHERE schedule_item_id = ?', [id])).rows[0].n);
    if (count >= 3) return res.status(400).json({ error: 'a schedule item can only have 3 posts' });
    const maxPos = Number((await db.execute('SELECT COALESCE(MAX(position), -1) AS m FROM posts WHERE schedule_item_id = ?', [id])).rows[0].m);
    const text = req.body.text || '';
    const imageData = req.file ? req.file.buffer : null;
    const imageMime = req.file ? req.file.mimetype : null;
    const info = await db.execute(
      'INSERT INTO posts (schedule_item_id, position, text, image_data, image_mime) VALUES (?, ?, ?, ?, ?)',
      [id, maxPos + 1, text, imageData, imageMime]
    );
    const postId = Number(info.lastInsertRowid);
    res.status(201).json({ id: postId, text, imagePath: imageMime ? `/api/posts/${postId}/image` : null });
  } catch (err) { next(err); }
});

router.put('/posts/:id', upload.single('image'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = (await db.execute('SELECT * FROM posts WHERE id = ?', [id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'not found' });
    const text = req.body.text !== undefined ? req.body.text : existing.text;
    const imageData = req.file ? req.file.buffer : existing.image_data;
    const imageMime = req.file ? req.file.mimetype : existing.image_mime;
    await db.execute('UPDATE posts SET text = ?, image_data = ?, image_mime = ? WHERE id = ?', [text, imageData, imageMime, id]);
    res.json({ id, text, imagePath: imageMime ? `/api/posts/${id}/image` : null });
  } catch (err) { next(err); }
});

router.delete('/posts/:id', async (req, res, next) => {
  try {
    await db.execute('DELETE FROM posts WHERE id = ?', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get('/posts/:id/image', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const post = (await db.execute('SELECT image_data, image_mime FROM posts WHERE id = ?', [id])).rows[0];
    if (!post || !post.image_data) return res.status(404).end();
    res.set('Content-Type', post.image_mime || 'application/octet-stream');
    res.set('Cache-Control', 'private, max-age=31536000, immutable');
    res.send(Buffer.from(post.image_data));
  } catch (err) { next(err); }
});

module.exports = router;
