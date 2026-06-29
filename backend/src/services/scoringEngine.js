/**
 * LeadLens Scoring Engine v2
 *
 * Generates a 0-100 qualification score with a detailed breakdown.
 * Each dimension is scored independently, then weighted into a total.
 *
 * Scoring Buckets:
 *   Hot    – 75-100  (Exceptional — schedule call immediately)
 *   Good   – 55-74   (Promising — follow up within 3-5 days)
 *   Maybe  – 35-54   (Potential — needs more info / nurture)
 *   Low    –  0-34   (Not a fit right now)
 *
 * Founder Dimensions (total weight = 100):
 *   Problem & Solution Clarity  – 15
 *   MVP Maturity                – 18
 *   Traction & Growth           – 20
 *   Team Strength               – 18
 *   Funding Readiness           – 14
 *   Validation Evidence         – 15
 *
 * Investor Dimensions (total weight = 100):
 *   Thesis Alignment            – 20
 *   Stage Match                 – 18
 *   Cheque Fit                  – 15
 *   Portfolio Experience        – 15
 *   Support Value               – 17
 *   Deployment Urgency          – 15
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

const clamp = (val, min = 0, max = 100) => Math.min(max, Math.max(min, val));

const scoreLabel = (score) => {
  if (score >= 75) return 'hot';
  if (score >= 55) return 'good';
  if (score >= 35) return 'maybe';
  return 'low';
};

// ── Founder Scorer ────────────────────────────────────────────────────────────

function scoreFounder(data) {
  const breakdown = {};

  // 1. Problem & Solution Clarity (15 pts)
  //    Measures how well the founder can articulate their problem and solution.
  //    Concise-but-clear pitches (15+ words) still score well.
  const problemWords  = (data.problem_statement || '').trim().split(/\s+/).length;
  const solutionWords = (data.solution_summary  || '').trim().split(/\s+/).length;
  const avgWords = (problemWords + solutionWords) / 2;
  breakdown.problem_clarity = clamp(
    avgWords >= 35 ? 15 :
    avgWords >= 25 ? 13 :
    avgWords >= 18 ? 11 :
    avgWords >= 12 ? 9  :
    avgWords >= 8  ? 7  : 4,
    0, 15
  );

  // 2. MVP Maturity (18 pts)
  //    A working product is the strongest early signal.
  //    Even "just an idea" gets meaningful points if the pitch is strong.
  const mvpMap = {
    'Just an idea'       : 5,
    'Prototype / Demo'   : 10,
    'Beta / Early users' : 15,
    'Live product'       : 18,
  };
  breakdown.mvp_maturity = mvpMap[data.mvp_status] ?? 3;

  // 3. Traction & Growth (20 pts)
  //    Users (0-8) + Revenue (0-8) + Growth (0-4).
  //    Pre-revenue startups get base credit for transparency.
  let traction = 0;
  const users  = Number(data.active_users)    || 0;
  const rev    = Number(data.monthly_revenue) || 0;
  const growth = Number(data.growth_rate_pct) || 0;

  // Users sub-score (0-8)
  if (users >= 10000)     traction += 8;
  else if (users >= 1000) traction += 7;
  else if (users >= 500)  traction += 6;
  else if (users >= 100)  traction += 5;
  else if (users >= 10)   traction += 4;
  else if (users >= 1)    traction += 2;
  else                    traction += 1;  // honesty credit

  // Revenue sub-score (0-8)
  if (rev >= 50000)       traction += 8;
  else if (rev >= 10000)  traction += 7;
  else if (rev >= 5000)   traction += 6;
  else if (rev >= 1000)   traction += 5;
  else if (rev >= 100)    traction += 3;
  else if (rev > 0)       traction += 2;
  else                    traction += 1;  // pre-revenue credit

  // Growth sub-score (0-4)
  if (growth >= 30)       traction += 4;
  else if (growth >= 20)  traction += 3;
  else if (growth >= 10)  traction += 2;
  else if (growth > 0)    traction += 1;

  breakdown.traction = clamp(traction, 0, 20);

  // 4. Team Strength (18 pts)
  //    VCs consistently rank team as the #1 factor at early stage.
  //    Technical co-founder is a massive signal.
  let team = 0;
  const teamSize = Number(data.team_size) || 0;
  if (teamSize >= 5)      team += 6;
  else if (teamSize >= 3) team += 5;
  else if (teamSize >= 2) team += 3;
  else                    team += 1;

  if (data.has_technical_cofounder) team += 7;

  const role = data.role_in_startup || '';
  if (['Founder / Co-founder', 'CEO', 'CTO'].includes(role)) team += 5;
  else team += 2;

  breakdown.team_strength = clamp(team, 0, 18);

  // 5. Funding Readiness (14 pts)
  //    Rewards founders who have a clear stage and a well-thought-out plan.
  const stageMap = {
    'Bootstrapped'     : 4,
    'Friends & Family'  : 6,
    'Pre-Seed'         : 9,
    'Seed'             : 11,
    'Series A+'        : 13,
  };
  let funding = stageMap[data.funding_stage] ?? 3;
  const fundsWords = (data.use_of_funds || '').trim().split(/\s+/).length;
  if (fundsWords >= 8)       funding = Math.min(funding + 3, 14);
  else if (fundsWords >= 5)  funding = Math.min(funding + 2, 14);
  else if (fundsWords >= 3)  funding = Math.min(funding + 1, 14);
  breakdown.funding_readiness = clamp(funding, 0, 14);

  // 6. Validation Evidence (15 pts)
  //    Paying customers are the ultimate signal. Testimonials add social proof.
  let validation = 0;
  if (data.has_paying_customers) validation += 10;
  const testimonialWords = (data.customer_testimonials || '').trim().split(/\s+/).length;
  if (testimonialWords >= 10) validation += 5;
  else if (testimonialWords >= 5) validation += 3;
  else if (testimonialWords >= 2) validation += 1;
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
  //    A well-articulated thesis indicates a serious, focused investor.
  const thesisWords = (data.thesis_summary || '').trim().split(/\s+/).length;
  breakdown.thesis_alignment = clamp(
    thesisWords >= 35 ? 20 :
    thesisWords >= 20 ? 16 :
    thesisWords >= 12 ? 12 :
    thesisWords >= 8  ? 8  : 4,
    0, 20
  );

  // 2. Stage Match (18 pts)
  //    We reward early-stage focus (pre-seed, seed) since that's our pipeline.
  const stages = data.stage_focus || [];
  let stageScore = 0;
  if (stages.includes('Pre-Seed'))  stageScore += 9;
  if (stages.includes('Seed'))      stageScore += 7;
  if (stages.includes('Series A'))  stageScore += 4;
  if (stages.includes('Series B+')) stageScore += 2;
  breakdown.stage_match = clamp(stageScore, 0, 18);

  // 3. Cheque Fit (15 pts)
  //    Larger cheque = more serious = higher score.
  const cheque = Number(data.typical_cheque_usd) || 0;
  breakdown.cheque_fit = clamp(
    cheque >= 500000  ? 15 :
    cheque >= 200000  ? 13 :
    cheque >= 100000  ? 11 :
    cheque >= 50000   ? 9  :
    cheque >= 25000   ? 7  :
    cheque >= 10000   ? 5  :
    cheque > 0        ? 3  : 0,
    0, 15
  );

  // 4. Portfolio Experience (15 pts)
  //    Portfolio size (0-10) + notable investments quality (0-5).
  const portfolio = Number(data.portfolio_size) || 0;
  let portScore = clamp(
    portfolio >= 20 ? 10 :
    portfolio >= 10 ? 8  :
    portfolio >= 5  ? 6  :
    portfolio >= 1  ? 4  : 1,
    0, 10
  );
  const notableWords = (data.notable_investments || '').trim().split(/\s+/).length;
  if (notableWords >= 5) portScore += 5;
  else if (notableWords >= 2) portScore += 3;
  breakdown.portfolio_experience = clamp(portScore, 0, 15);

  // 5. Support Value (17 pts)
  //    Investors who bring more than capital are far more valuable.
  const supports = data.support_type || [];
  let supportScore = 0;
  if (supports.includes('Strategic mentorship'))  supportScore += 5;
  if (supports.includes('Network access'))         supportScore += 4;
  if (supports.includes('Business development'))   supportScore += 3;
  if (supports.includes('Hiring support'))         supportScore += 3;
  if (supports.includes('Follow-on capital'))      supportScore += 3;
  if (supports.length === 1 && supports[0] === 'Capital only') supportScore = 3;

  // Involvement level bonus
  const involvementMap = {
    'Hands-on (board seat)': 3,
    'Active (monthly)': 2,
    'Light-touch (quarterly check-ins)': 1,
    'Passive (capital only)': 0,
  };
  supportScore += involvementMap[data.involvement_level] ?? 0;

  breakdown.support_value = clamp(supportScore, 0, 17);

  // 6. Deployment Urgency (15 pts)
  //    Investors ready to deploy immediately are most valuable.
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
