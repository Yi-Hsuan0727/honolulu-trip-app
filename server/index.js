const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/trip'));
app.use('/api', require('./routes/schedule'));
app.use('/api', require('./routes/prep'));

app.get('/sw.js', (req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  next();
});
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

// Photos uploaded before thumbnails existed get one generated in the background,
// so the first visitor doesn't wait on a full-size download.
async function backfillThumbnails() {
  const { makeThumb } = require('./images');
  const ids = (await db.execute('SELECT id FROM posts WHERE image_data IS NOT NULL AND thumb_data IS NULL')).rows.map(r => r.id);
  for (const id of ids) {
    const post = (await db.execute('SELECT image_data FROM posts WHERE id = ?', [id])).rows[0];
    if (!post || !post.image_data) continue;
    try {
      await db.execute('UPDATE posts SET thumb_data = ? WHERE id = ?', [await makeThumb(Buffer.from(post.image_data)), id]);
    } catch (e) { console.error('thumbnail for post', id, 'failed:', e.message); }
  }
}

const PORT = process.env.PORT || 3000;
db.ready
  .then(() => {
    app.listen(PORT, () => console.log(`Honolulu trip app listening on http://localhost:${PORT}`));
    backfillThumbnails().catch((err) => console.error('thumbnail backfill failed:', err.message));
  })
  .catch((err) => { console.error('Failed to start: database not ready.', err); process.exit(1); });
