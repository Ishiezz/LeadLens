const express = require('express');
const { query } = require('../utils/db');
const router = express.Router();

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [overview, byStatus, byType, recent, avgScore] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM lead_overview`),
      query(`
        SELECT status, COUNT(*) AS count
        FROM lead_overview
        GROUP BY status
      `),
      query(`
        SELECT type, COUNT(*) AS count, ROUND(AVG(score)) AS avg_score
        FROM lead_overview
        GROUP BY type
      `),
      query(`
        SELECT type, full_name, email, score, status, created_at
        FROM lead_overview
        ORDER BY created_at DESC
        LIMIT 5
      `),
      query(`SELECT ROUND(AVG(score)) AS avg FROM lead_overview`),
    ]);

    // Weekly trend (last 4 weeks)
    const trendRes = await query(`
      SELECT
        DATE_TRUNC('week', created_at) AS week,
        COUNT(*) AS count,
        ROUND(AVG(score)) AS avg_score
      FROM lead_overview
      WHERE created_at >= NOW() - INTERVAL '4 weeks'
      GROUP BY week
      ORDER BY week
    `);

    // Conversion funnel for this month
    const funnelRes = await query(`
      SELECT
        COUNT(*) AS total_sessions,
        COUNT(CASE WHEN state = 'completed' THEN 1 END) AS completed,
        COUNT(CASE WHEN state = 'abandoned' THEN 1 END) AS abandoned
      FROM chat_sessions
      WHERE started_at >= DATE_TRUNC('month', NOW())
    `);

    res.json({
      total_leads   : Number(overview.rows[0].total),
      average_score : Number(avgScore.rows[0].avg) || 0,
      by_status     : byStatus.rows,
      by_type       : byType.rows,
      recent_leads  : recent.rows,
      weekly_trend  : trendRes.rows,
      funnel        : funnelRes.rows[0],
    });
  } catch (err) { next(err); }
});

module.exports = router;
