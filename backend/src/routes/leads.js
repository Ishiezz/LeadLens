const express = require('express');
const { query } = require('../utils/db');
const router = express.Router();

// ─── GET /api/leads ───────────────────────────────────────────────────────────
// Returns paginated list from the lead_overview view
router.get('/', async (req, res, next) => {
  try {
    const {
      type, status, search,
      page = 1, limit = 20,
      sort_by = 'created_at', sort_dir = 'desc',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const allowed_sorts = ['created_at', 'score', 'full_name'];
    const safeSort = allowed_sorts.includes(sort_by) ? sort_by : 'created_at';
    const safeDir  = sort_dir === 'asc' ? 'ASC' : 'DESC';

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (type) {
      params.push(type);
      whereClause += ` AND type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM lead_overview ${whereClause}`, params
    );

    params.push(Number(limit), offset);
    const dataRes = await query(
      `SELECT * FROM lead_overview ${whereClause}
       ORDER BY ${safeSort} ${safeDir}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      total: Number(countRes.rows[0].count),
      page : Number(page),
      limit: Number(limit),
      data : dataRes.rows,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/leads/:type/:id ─────────────────────────────────────────────────
router.get('/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const table = type === 'founder' ? 'founder_leads' : 'investor_leads';
    const result = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Lead not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── PATCH /api/leads/:type/:id/notes ────────────────────────────────────────
router.patch('/:type/:id/notes', async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { internal_notes } = req.body;
    const table = type === 'founder' ? 'founder_leads' : 'investor_leads';
    const result = await query(
      `UPDATE ${table} SET internal_notes = $1 WHERE id = $2 RETURNING *`,
      [internal_notes, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Lead not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
