const express = require('express');
const db = require('../db');
const { PREP } = require('../data/trip');

const router = express.Router();

router.get('/prep', async (req, res, next) => {
  try {
    const groups = await Promise.all(PREP.map(async (g, gi) => {
      const items = (await db.execute('SELECT * FROM prep_items WHERE group_index = ? ORDER BY position ASC', [gi])).rows;
      return {
        title: g.title, icon: g.icon,
        items: items.map(it => ({ id: it.id, label: it.label, done: !!it.done }))
      };
    }));
    res.json(groups);
  } catch (err) { next(err); }
});

router.post('/prep/:groupIndex/items', async (req, res, next) => {
  try {
    const gi = Number(req.params.groupIndex);
    const label = (req.body.label || '').trim();
    if (!label) return res.status(400).json({ error: 'label required' });
    const maxPos = Number((await db.execute('SELECT COALESCE(MAX(position), -1) AS m FROM prep_items WHERE group_index = ?', [gi])).rows[0].m);
    const info = await db.execute('INSERT INTO prep_items (group_index, position, label, done) VALUES (?, ?, ?, 0)', [gi, maxPos + 1, label]);
    const item = (await db.execute('SELECT * FROM prep_items WHERE id = ?', [Number(info.lastInsertRowid)])).rows[0];
    res.status(201).json({ id: item.id, label: item.label, done: !!item.done });
  } catch (err) { next(err); }
});

router.put('/prep-items/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = (await db.execute('SELECT * FROM prep_items WHERE id = ?', [id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'not found' });
    const done = req.body.done !== undefined ? (req.body.done ? 1 : 0) : existing.done;
    const label = req.body.label !== undefined ? req.body.label : existing.label;
    await db.execute('UPDATE prep_items SET done = ?, label = ? WHERE id = ?', [done, label, id]);
    const item = (await db.execute('SELECT * FROM prep_items WHERE id = ?', [id])).rows[0];
    res.json({ id: item.id, label: item.label, done: !!item.done });
  } catch (err) { next(err); }
});

router.delete('/prep-items/:id', async (req, res, next) => {
  try {
    await db.execute('DELETE FROM prep_items WHERE id = ?', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
