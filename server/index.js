const express = require('express');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/trip'));
app.use('/api', require('./routes/schedule'));
app.use('/api', require('./routes/prep'));

app.use('/uploads', express.static(uploadsDir));
app.get('/sw.js', (req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  next();
});
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Honolulu trip app listening on http://localhost:${PORT}`));
