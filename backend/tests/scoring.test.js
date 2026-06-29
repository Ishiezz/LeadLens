const { scoreFounder, scoreInvestor, scoreLabel } = require('../src/services/scoringEngine');

// ── scoreLabel ────────────────────────────────────────────────────────────────
describe('scoreLabel()', () => {
  it('returns "hot" for scores 80-100',   () => expect(scoreLabel(80)).toBe('hot'));
  it('returns "hot" for score 100',       () => expect(scoreLabel(100)).toBe('hot'));
  it('returns "good" for scores 60-79',   () => expect(scoreLabel(60)).toBe('good'));
  it('returns "good" for score 79',       () => expect(scoreLabel(79)).toBe('good'));
  it('returns "maybe" for scores 40-59',  () => expect(scoreLabel(40)).toBe('maybe'));
  it('returns "low" for scores 0-39',     () => expect(scoreLabel(0)).toBe('low'));
  it('returns "low" for score 39',        () => expect(scoreLabel(39)).toBe('low'));
});

// ── scoreFounder ──────────────────────────────────────────────────────────────
describe('scoreFounder()', () => {
  const strongFounder = {
    full_name: 'Priya Sharma',
    problem_statement: 'Small businesses spend 10+ hours/week on manual bookkeeping. Our AI automates this completely.',
    solution_summary: 'A zero-touch accounting assistant that reads bank statements and auto-categorises every transaction with 99% accuracy.',
    mvp_status: 'Live product',
    active_users: 5000,
    monthly_revenue: 25000,
    growth_rate_pct: 25,
    team_size: 4,
    has_technical_cofounder: true,
    role_in_startup: 'Founder / Co-founder',
    funding_stage: 'Seed',
    amount_raising_usd: 500000,
    use_of_funds: 'Expand engineering team and run paid acquisition experiments',
    has_paying_customers: true,
    customer_testimonials: 'CTO of Acme Corp says: saved us 15 hours per week and caught errors worth $3k.',
  };

  it('gives a strong founder a score >= 70', () => {
    const { score } = scoreFounder(strongFounder);
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it('returns "hot" or "good" status for strong founder', () => {
    const { status } = scoreFounder(strongFounder);
    expect(['hot', 'good']).toContain(status);
  });

  it('gives a weak founder a score < 40', () => {
    const weakFounder = {
      problem_statement: 'Idea',
      solution_summary: 'App',
      mvp_status: 'Just an idea',
      active_users: 0,
      monthly_revenue: 0,
      team_size: 1,
      has_technical_cofounder: false,
      role_in_startup: 'Other',
      funding_stage: 'Bootstrapped',
      has_paying_customers: false,
    };
    const { score } = scoreFounder(weakFounder);
    expect(score).toBeLessThan(40);
  });

  it('returns a score_breakdown object with all dimensions', () => {
    const { score_breakdown } = scoreFounder(strongFounder);
    expect(score_breakdown).toHaveProperty('problem_clarity');
    expect(score_breakdown).toHaveProperty('mvp_maturity');
    expect(score_breakdown).toHaveProperty('traction');
    expect(score_breakdown).toHaveProperty('team_strength');
    expect(score_breakdown).toHaveProperty('funding_readiness');
    expect(score_breakdown).toHaveProperty('validation_evidence');
  });

  it('score is always between 0 and 100', () => {
    const { score } = scoreFounder(strongFounder);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ── scoreInvestor ─────────────────────────────────────────────────────────────
describe('scoreInvestor()', () => {
  const strongInvestor = {
    thesis_summary: 'We back exceptional founders building transformative B2B software in India at the seed stage, with a strong bias towards AI-first companies that have early revenue traction.',
    stage_focus: ['Pre-Seed', 'Seed'],
    typical_cheque_usd: 200000,
    min_cheque_usd: 50000,
    max_cheque_usd: 500000,
    portfolio_size: 15,
    notable_investments: 'Razorpay, Setu, Signzy',
    geography_focus: ['India', 'South Asia'],
    support_type: ['Strategic mentorship', 'Network access', 'Business development', 'Follow-on capital'],
    involvement_level: 'Active (monthly)',
    deployment_timeline: 'Immediately',
    num_deals_per_year: 8,
  };

  it('gives a strong investor a score >= 70', () => {
    const { score } = scoreInvestor(strongInvestor);
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it('returns expected dimensions in breakdown', () => {
    const { score_breakdown } = scoreInvestor(strongInvestor);
    expect(score_breakdown).toHaveProperty('thesis_alignment');
    expect(score_breakdown).toHaveProperty('stage_match');
    expect(score_breakdown).toHaveProperty('cheque_fit');
    expect(score_breakdown).toHaveProperty('portfolio_experience');
    expect(score_breakdown).toHaveProperty('support_value');
    expect(score_breakdown).toHaveProperty('deployment_urgency');
  });

  it('score is always between 0 and 100', () => {
    const { score } = scoreInvestor(strongInvestor);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('gives a passive capital-only investor a lower score', () => {
    const passiveInvestor = {
      ...strongInvestor,
      support_type: ['Capital only'],
      deployment_timeline: 'Within 12 months',
      stage_focus: ['Series B+'],
    };
    const { score: activeScore }  = scoreInvestor(strongInvestor);
    const { score: passiveScore } = scoreInvestor(passiveInvestor);
    expect(activeScore).toBeGreaterThan(passiveScore);
  });
});
