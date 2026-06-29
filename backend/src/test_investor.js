require('dotenv').config();
const { pool, query } = require('./utils/db');
const { scoreInvestor } = require('./services/scoringEngine');

async function test() {
  const session_id = '00000000-0000-0000-0000-000000000000';
  
  const ctx = {
    full_name: 'Vikram Sharma',
    email: 'vikram@angel.co',
    firm_name: 'Angel VC',
    thesis_summary: 'I invest in early stage tech startups with strong tech co-founders.',
    preferred_sectors: ['SaaS / B2B Software', 'Fintech'],
    stage_focus: ['Pre-Seed', 'Seed'],
    typical_cheque_usd: 100000,
    portfolio_size: 10,
    geography_focus: ['India'],
    support_type: ['Strategic mentorship', 'Network access'],
    involvement_level: 'Active (monthly)',
    deployment_timeline: 'Immediately',
    num_deals_per_year: 5
  };

  const scoreData = scoreInvestor(ctx);

  try {
    // Delete if exists
    await query(`DELETE FROM investor_leads WHERE session_id = $1`, [session_id]);
    await query(`DELETE FROM chat_sessions WHERE id = $1`, [session_id]);

    // Insert dummy session
    await query(
      `INSERT INTO chat_sessions (id, lead_type, state, current_step) VALUES ($1, 'investor', 'in_progress', 18)`,
      [session_id]
    );

    // Insert investor
    const res = await query(
      `INSERT INTO investor_leads (
        session_id, full_name, email, phone, linkedin_url, firm_name, thesis_summary,
        preferred_sectors, stage_focus, typical_cheque_usd, min_cheque_usd, max_cheque_usd,
        portfolio_size, notable_investments, geography_focus, support_type, involvement_level,
        deployment_timeline, num_deals_per_year,
        score, status, score_breakdown
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
      ) RETURNING *`,
      [
        session_id,
        ctx.full_name, ctx.email, ctx.phone || null, ctx.linkedin_url || null,
        ctx.firm_name, ctx.thesis_summary,
        ctx.preferred_sectors || [], ctx.stage_focus || [],
        ctx.typical_cheque_usd || 0, ctx.min_cheque_usd || null, ctx.max_cheque_usd || null,
        ctx.portfolio_size || 0, ctx.notable_investments || null,
        ctx.geography_focus || [], ctx.support_type || [],
        ctx.involvement_level, ctx.deployment_timeline, ctx.num_deals_per_year || 0,
        scoreData.score, scoreData.status, JSON.stringify(scoreData.score_breakdown),
      ]
    );
    console.log('Success:', res.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

test();
