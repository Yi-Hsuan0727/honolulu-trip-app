const express = require('express');
const db = require('../db');
const { PREP } = require('../data/trip');

const router = express.Router();

router.get('/prep', (req, res) => {
  const groups = PREP.map((g, gi) => {
    const items = db.prepare('SELECT * FROM prep_items WHERE group_index = ? ORDER BY position ASC').all(gi);
    return {
      title: g.title, icon: g.icon,
      items: items.map(it => ({ id: it.id, label: it.label, done: !!it.done }))
    };
  });
  res.json(groups);
});

router.post('/prep/:groupIndex/items', (req, res) => {
  const gi = Number(req.params.groupIndex);
  const label = (req.body.label || '').trim();
  if (!label) return res.status(400).json({ error: 'label required' });
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM prep_items WHERE group_index = ?').get(gi).m;
  const info = db.prepare('INSERT INTO prep_items (group_index, position, label, done) VALUES (?, ?, ?, 0)').run(gi, maxPos + 1, label);
  const item = db.prepare('SELECT * FROM prep_items WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ id: item.id, label: item.label, done: !!item.done });
});

router.put('/prep-items/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM prep_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const done = req.body.done !== undefined ? (req.body.done ? 1 : 0) : existing.done;
  const label = req.body.label !== undefined ? req.body.label : existing.label;
  db.prepare('UPDATE prep_items SET done = ?, label = ? WHERE id = ?').run(done, label, id);
  const item = db.prepare('SELECT * FROM prep_items WHERE id = ?').get(id);
  res.json({ id: item.id, label: item.label, done: !!item.done });
});

router.delete('/prep-items/:id', (req, res) => {
  db.prepare('DELETE FROM prep_items WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
