const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { query } = require('../utils/db');
const { FOUNDER_FLOW, INVESTOR_FLOW } = require('../services/conversationFlow');
const { scoreFounder, scoreInvestor } = require('../services/scoringEngine');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFlow(leadType) {
  return leadType === 'founder' ? FOUNDER_FLOW : INVESTOR_FLOW;
}

function resolveMessage(step, ctx) {
  return typeof step.message === 'function' ? step.message(ctx) : step.message;
}

function validateAnswer(step, value) {
  // Type-based validation
  if (step.required && (!value || String(value).trim() === '')) {
    return `This field is required.`;
  }
  if (value) {
    if (step.type === 'email') {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(value)) return 'Please enter a valid email address.';
    }
    if (step.type === 'number') {
      if (isNaN(Number(value))) return 'Please enter a valid number.';
    }
    if (step.type === 'url' && value) {
      try { new URL(value); } catch { return 'Please enter a valid URL.'; }
    }
    if (step.type === 'boolean' && !['yes', 'no', 'true', 'false'].includes(String(value).toLowerCase())) {
      return 'Please answer Yes or No.';
    }
  }
  // Custom validator
  if (step.validator) {
    return step.validator(value);
  }
  return null;
}

function normaliseValue(step, raw) {
  if (step.type === 'boolean') {
    return ['yes', 'true', '1'].includes(String(raw).toLowerCase());
  }
  if (step.type === 'number') return Number(raw);
  if (step.type === 'multiselect') {
    return Array.isArray(raw) ? raw : String(raw).split(',').map(s => s.trim());
  }
  return String(raw).trim();
}

// ─── POST /api/chat/start ─────────────────────────────────────────────────────
router.post(
  '/start',
  [body('lead_type').isIn(['founder', 'investor'])],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { lead_type } = req.body;
      const sessionId = uuidv4();

      await query(
        `INSERT INTO chat_sessions (id, lead_type, state, current_step, ip_address, user_agent)
         VALUES ($1, $2, 'in_progress', 0, $3, $4)`,
        [sessionId, lead_type, req.ip, req.headers['user-agent']]
      );

      const flow = getFlow(lead_type);
      const firstStep = flow[0];

      return res.json({
        session_id : sessionId,
        lead_type,
        step       : 0,
        total_steps: flow.length,
        question   : resolveMessage(firstStep, {}),
        step_key   : firstStep.key,
        type       : firstStep.type,
        options    : firstStep.options || null,
        required   : firstStep.required,
        progress   : 0,
      });
    } catch (err) { next(err); }
  }
);

// ─── POST /api/chat/message ───────────────────────────────────────────────────
router.post(
  '/message',
  [
    body('session_id').isUUID(),
    body('value').exists(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { session_id, value } = req.body;

      // Load session
      const sessionRes = await query(
        `SELECT * FROM chat_sessions WHERE id = $1`,
        [session_id]
      );
      if (!sessionRes.rows.length) return res.status(404).json({ error: 'Session not found.' });

      const session = sessionRes.rows[0];
      if (session.state !== 'in_progress') {
        return res.status(400).json({ error: 'Session is already completed.' });
      }

      const flow = getFlow(session.lead_type);

      // Reconstruct context from stored messages
      const messagesRes = await query(
        `SELECT step_key, content FROM chat_messages WHERE session_id = $1 AND role = 'user' ORDER BY created_at`,
        [session_id]
      );
      const ctx = {};
      messagesRes.rows.forEach(row => {
        if (row.step_key) ctx[row.step_key] = row.content;
      });

      // Find current step (skip steps that should be skipped)
      let stepIndex = session.current_step;
      let currentStep = flow[stepIndex];

      // Validate
      const validationError = validateAnswer(currentStep, value);
      if (validationError) {
        return res.status(422).json({ error: validationError, retry: true });
      }

      const normalisedValue = normaliseValue(currentStep, value);

      // Store user message
      await query(
        `INSERT INTO chat_messages (session_id, role, content, step_key) VALUES ($1, 'user', $2, $3)`,
        [session_id, String(value), currentStep.key]
      );

      // Update context
      ctx[currentStep.key] = normalisedValue;

      // Advance to next non-skipped step
      let nextIndex = stepIndex + 1;
      while (nextIndex < flow.length && flow[nextIndex].skipIf && flow[nextIndex].skipIf(ctx)) {
        nextIndex++;
      }

      // Update current step in DB
      await query(
        `UPDATE chat_sessions SET current_step = $1 WHERE id = $2`,
        [nextIndex, session_id]
      );

      // ── Conversation Complete ───────────────────────────────────────────────
      if (nextIndex >= flow.length) {
        // Generate score
        const scoreFn  = session.lead_type === 'founder' ? scoreFounder : scoreInvestor;
        const scoreData = scoreFn(ctx);

        // Persist lead to appropriate table
        if (session.lead_type === 'founder') {
          await query(
            `INSERT INTO founder_leads (
              session_id, full_name, email, phone, linkedin_url, role_in_startup, startup_name,
              industry, problem_statement, solution_summary, mvp_status, active_users, monthly_revenue,
              growth_rate_pct, team_size, has_technical_cofounder, funding_stage, amount_raising_usd,
              use_of_funds, has_paying_customers, customer_testimonials,
              score, status, score_breakdown
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
            )`,
            [
              session_id,
              ctx.full_name, ctx.email, ctx.phone || null, ctx.linkedin_url || null,
              ctx.role_in_startup, ctx.startup_name, ctx.industry,
              ctx.problem_statement, ctx.solution_summary, ctx.mvp_status,
              ctx.active_users || 0, ctx.monthly_revenue || 0, ctx.growth_rate_pct || null,
              ctx.team_size, ctx.has_technical_cofounder,
              ctx.funding_stage, ctx.amount_raising_usd || 0, ctx.use_of_funds,
              ctx.has_paying_customers, ctx.customer_testimonials || null,
              scoreData.score, scoreData.status, JSON.stringify(scoreData.score_breakdown),
            ]
          );
        } else {
          await query(
            `INSERT INTO investor_leads (
              session_id, full_name, email, phone, linkedin_url, firm_name, thesis_summary,
              preferred_sectors, stage_focus, typical_cheque_usd, min_cheque_usd, max_cheque_usd,
              portfolio_size, notable_investments, geography_focus, support_type, involvement_level,
              deployment_timeline, num_deals_per_year,
              score, status, score_breakdown
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
            )`,
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
        }

        // Mark session complete
        await query(
          `UPDATE chat_sessions SET state = 'completed', completed_at = NOW() WHERE id = $1`,
          [session_id]
        );

        // Closing message based on status
        const closingMessages = {
          hot  : `🔥 Amazing, ${ctx.full_name}! You look like a great fit for LeadLens. Our team will reach out within 24 hours. Watch your inbox!`,
          good : `✅ Thanks ${ctx.full_name}! We see strong potential here. Expect a follow-up from our team within 3–5 business days.`,
          maybe: `📋 Thank you, ${ctx.full_name}! We'd love to learn more. Our team may reach out with a few follow-up questions.`,
          low  : `🙏 Thank you for your time, ${ctx.full_name}! While you may not be the right fit for our current programs, we wish you all the best on your journey.`,
        };

        return res.json({
          completed    : true,
          score        : scoreData.score,
          status       : scoreData.status,
          breakdown    : scoreData.score_breakdown,
          closing_message: closingMessages[scoreData.status],
        });
      }

      // ── Next Question ──────────────────────────────────────────────────────
      const nextStep = flow[nextIndex];
      const botMessage = resolveMessage(nextStep, ctx);

      await query(
        `INSERT INTO chat_messages (session_id, role, content, step_key) VALUES ($1, 'bot', $2, $3)`,
        [session_id, botMessage, nextStep.key]
      );

      return res.json({
        completed  : false,
        step       : nextIndex,
        total_steps: flow.length,
        question   : botMessage,
        step_key   : nextStep.key,
        type       : nextStep.type,
        options    : nextStep.options || null,
        required   : nextStep.required,
        progress   : Math.round((nextIndex / flow.length) * 100),
      });
    } catch (err) { next(err); }
  }
);

// ─── GET /api/chat/session/:id ────────────────────────────────────────────────
router.get('/session/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sessionRes = await query(`SELECT * FROM chat_sessions WHERE id = $1`, [id]);
    if (!sessionRes.rows.length) return res.status(404).json({ error: 'Session not found.' });

    const msgRes = await query(
      `SELECT role, content, step_key, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at`,
      [id]
    );
    return res.json({ session: sessionRes.rows[0], messages: msgRes.rows });
  } catch (err) { next(err); }
});

module.exports = router;
