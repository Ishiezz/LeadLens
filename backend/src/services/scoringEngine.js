/**
 * LeadLens Scoring Engine
 *
 * Generates a 0-100 qualification score with a detailed breakdown.
 * Each dimension is scored independently, then weighted into a total.
 *
 * Founder Dimensions (total weight = 100):
 *   Problem Clarity      – 15
 *   MVP Maturity         – 20
 *   Traction             – 25
 *   Team Strength        – 15
 *   Funding Readiness    – 10
 *   Validation Evidence  – 15
 *
 * Investor Dimensions (total weight = 100):
 *   Thesis Alignment     – 20
 *   Stage Match          – 20
 *   Cheque Fit           – 15
 *   Portfolio Experience – 15
 *   Support Value        – 15
 *   Deployment Urgency   – 15
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

const clamp = (val, min = 0, max = 100) => Math.min(max, Math.max(min, val));

const scoreLabel = (score) => {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'good';
  if (score >= 40) return 'maybe';
  return 'low';
};

// ── Founder Scorer ────────────────────────────────────────────────────────────

function scoreFounder(data) {
  const breakdown = {};

  // 1. Problem Clarity (15 pts)
  const problemWords  = (data.problem_statement || '').trim().split(/\s+/).length;
  const solutionWords = (data.solution_summary  || '').trim().split(/\s+/).length;
  const avgWords = (problemWords + solutionWords) / 2;
  breakdown.problem_clarity = clamp(
    avgWords >= 40 ? 15 :
    avgWords >= 25 ? 12 :
    avgWords >= 15 ? 8  : 4,
    0, 15
  );

  // 2. MVP Maturity (20 pts)
  const mvpMap = {
    'Just an idea'            : 5,
    'Prototype / Demo'        : 10,
    'Beta / Early users'      : 16,
    'Live product'            : 20,
  };
  breakdown.mvp_maturity = mvpMap[data.mvp_status] ?? 0;

  // 3. Traction (25 pts)
  let traction = 0;
  const users   = Number(data.active_users)    || 0;
  const rev     = Number(data.monthly_revenue) || 0;
  const growth  = Number(data.growth_rate_pct) || 0;

  // Users sub-score (0–10)
  if (users >= 10000) traction += 10;
  else if (users >= 1000) traction += 8;
  else if (users >= 100)  traction += 6;
  else if (users >= 10)   traction += 4;
  else if (users >= 1)    traction += 2;

  // Revenue sub-score (0–10)
  if (rev >= 50000)      traction += 10;
  else if (rev >= 10000) traction += 8;
  else if (rev >= 5000)  traction += 6;
  else if (rev >= 1000)  traction += 4;
  else if (rev > 0)      traction += 2;

  // Growth sub-score (0–5)
  if (growth >= 30)      traction += 5;
  else if (growth >= 20) traction += 4;
  else if (growth >= 10) traction += 3;
  else if (growth >= 5)  traction += 2;
  else if (growth > 0)   traction += 1;

  breakdown.traction = clamp(traction, 0, 25);

  // 4. Team Strength (15 pts)
  let team = 0;
  const teamSize = Number(data.team_size) || 0;
  if (teamSize >= 5)      team += 6;
  else if (teamSize >= 3) team += 4;
  else if (teamSize >= 2) team += 2;
  else                     team += 1;

  if (data.has_technical_cofounder) team += 5;

  const role = data.role_in_startup || '';
  if (['Founder / Co-founder', 'CEO', 'CTO'].includes(role)) team += 4;
  else team += 2;

  breakdown.team_strength = clamp(team, 0, 15);

  // 5. Funding Readiness (10 pts)
  const stageMap = {
    'Bootstrapped'     : 3,
    'Friends & Family' : 5,
    'Pre-Seed'         : 7,
    'Seed'             : 9,
    'Series A+'        : 10,
  };
  let funding = stageMap[data.funding_stage] ?? 3;
  if (data.use_of_funds && data.use_of_funds.trim().split(/\s+/).length >= 5) {
    funding = Math.min(funding + 2, 10);
  }
  breakdown.funding_readiness = clamp(funding, 0, 10);

  // 6. Validation Evidence (15 pts)
  let validation = 0;
  if (data.has_paying_customers) validation += 10;
  const testimonialWords = (data.customer_testimonials || '').trim().split(/\s+/).length;
  if (testimonialWords >= 10) validation += 5;
  else if (testimonialWords >= 5) validation += 3;
  breakdown.validation_evidence = clamp(validation, 0, 15);

  const totalScore = clamp(
    Object.values(breakdown).reduce((a, b) => a + b, 0),
    0, 100
  );

  return {
    score: Math.round(totalScore),
    status: scoreLabel(totalScore),
    score_breakdown: breakdown,
  };
}

// ── Investor Scorer ───────────────────────────────────────────────────────────

function scoreInvestor(data) {
  const breakdown = {};

  // 1. Thesis Alignment (20 pts)
  const thesisWords = (data.thesis_summary || '').trim().split(/\s+/).length;
  breakdown.thesis_alignment = clamp(
    thesisWords >= 40 ? 20 :
    thesisWords >= 20 ? 15 :
    thesisWords >= 10 ? 10 : 5,
    0, 20
  );

  // 2. Stage Match (20 pts) – we reward early-stage focus
  const stages = data.stage_focus || [];
  let stageScore = 0;
  if (stages.includes('Pre-Seed')) stageScore += 10;
  if (stages.includes('Seed'))     stageScore += 8;
  if (stages.includes('Series A')) stageScore += 5;
  if (stages.includes('Series B+')) stageScore += 2;
  breakdown.stage_match = clamp(stageScore, 0, 20);

  // 3. Cheque Fit (15 pts)
  const cheque = Number(data.typical_cheque_usd) || 0;
  breakdown.cheque_fit = clamp(
    cheque >= 500000  ? 15 :
    cheque >= 100000  ? 12 :
    cheque >= 50000   ? 9  :
    cheque >= 10000   ? 6  :
    cheque > 0        ? 3  : 0,
    0, 15
  );

  // 4. Portfolio Experience (15 pts)
  const portfolio = Number(data.portfolio_size) || 0;
  let portScore = clamp(
    portfolio >= 20 ? 10 :
    portfolio >= 10 ? 8  :
    portfolio >= 5  ? 6  :
    portfolio >= 1  ? 4  : 0,
    0, 10
  );
  const notableWords = (data.notable_investments || '').trim().split(/\s+/).length;
  if (notableWords >= 5) portScore += 5;
  breakdown.portfolio_experience = clamp(portScore, 0, 15);

  // 5. Support Value (15 pts)
  const supports = data.support_type || [];
  let supportScore = 0;
  if (supports.includes('Strategic mentorship'))  supportScore += 4;
  if (supports.includes('Network access'))         supportScore += 3;
  if (supports.includes('Business development'))  supportScore += 3;
  if (supports.includes('Hiring support'))        supportScore += 2;
  if (supports.includes('Follow-on capital'))     supportScore += 3;
  if (supports.length === 1 && supports[0] === 'Capital only') supportScore = 3;
  breakdown.support_value = clamp(supportScore, 0, 15);

  // 6. Deployment Urgency (15 pts)
  const urgencyMap = {
    'Immediately'       : 15,
    'Within 3 months'   : 11,
    'Within 6 months'   : 7,
    'Within 12 months'  : 4,
  };
  breakdown.deployment_urgency = urgencyMap[data.deployment_timeline] ?? 4;

  const totalScore = clamp(
    Object.values(breakdown).reduce((a, b) => a + b, 0),
    0, 100
  );

  return {
    score: Math.round(totalScore),
    status: scoreLabel(totalScore),
    score_breakdown: breakdown,
  };
}

module.exports = { scoreFounder, scoreInvestor, scoreLabel };
