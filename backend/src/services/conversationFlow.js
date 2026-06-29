/**
 * LeadLens – Conversation Flow Definitions
 *
 * Messages are conversational, warm, and adaptive.
 * Each step has:
 *   key        – DB field identifier
 *   message    – string OR fn(ctx) => string for personalised messages
 *   type       – 'text'|'email'|'phone'|'number'|'select'|'multiselect'|'boolean'|'url'
 *   options    – for select / multiselect
 *   required   – whether the step can be skipped
 *   validator  – fn(value) => string|null
 *   skipIf     – fn(ctx) => bool
 *   scoreWeight– informational weight for scoring
 */

// ── Transition phrases injected between sections ───────────────────────────
const T = {
  great   : '✨ Great!',
  perfect : '👌 Perfect.',
  awesome : '🚀 Awesome!',
  nice    : '💡 Nice!',
  thanks  : '🙏 Thanks for sharing that.',
  love    : '❤️ Love it.',
  noted   : '📝 Noted.',
};

const FOUNDER_FLOW = [
  // ── INTRO ────────────────────────────────────────────────────────────────
  {
    key: 'full_name',
    message: [
      "👋 Hey there! Welcome to LeadLens.",
      "",
      "I'm going to ask you a few questions to understand your startup — it only takes about 5 minutes.",
      "",
      "Let's start simple. What's your name?",
    ].join('\n'),
    type: 'text',
    required: true,
    validator: v => v.trim().length < 2 ? 'Please enter your full name.' : null,
  },
  {
    key: 'email',
    message: ctx => [
      `${T.great} Nice to meet you, ${ctx.full_name.split(' ')[0]}! 🎉`,
      "",
      "What's the best email to reach you on?",
    ].join('\n'),
    type: 'email',
    required: true,
  },
  {
    key: 'phone',
    message: "And your phone number? (With country code — e.g. +91 98765 43210)\n\nFeel free to skip this if you'd prefer.",
    type: 'phone',
    required: false,
  },
  {
    key: 'linkedin_url',
    message: "Drop your LinkedIn URL if you have one — helps us put a face to the name. 😊",
    type: 'url',
    required: false,
    validator: v => v && !v.includes('linkedin.com') ? 'That doesn\'t look like a LinkedIn URL. Try again or skip.' : null,
  },

  // ── BACKGROUND ───────────────────────────────────────────────────────────
  {
    key: 'role_in_startup',
    message: ctx => `${T.perfect}\n\nWhat's your role at the startup, ${ctx.full_name.split(' ')[0]}?`,
    type: 'select',
    required: true,
    options: ['Founder / Co-founder', 'CEO', 'CTO', 'COO', 'Other'],
    scoreWeight: 3,
  },
  {
    key: 'startup_name',
    message: "Love it. What's the name of your startup?",
    type: 'text',
    required: true,
  },
  {
    key: 'industry',
    message: ctx => `${T.nice} And what industry is ${ctx.startup_name} in?`,
    type: 'select',
    required: true,
    options: [
      'SaaS / B2B Software',
      'Fintech',
      'Healthtech',
      'Edtech',
      'Climate / Sustainability',
      'E-commerce / D2C',
      'DeepTech / AI',
      'Consumer App',
      'Other',
    ],
    scoreWeight: 2,
  },

  // ── PROBLEM ──────────────────────────────────────────────────────────────
  {
    key: 'problem_statement',
    message: ctx => [
      `${T.awesome} A ${ctx.industry} startup — exciting space.`,
      "",
      "Now the important bit 🎯",
      "",
      `What problem is ${ctx.startup_name} solving? Describe it in 2–3 sentences — imagine you're explaining it to a smart friend who doesn't know your industry.`,
    ].join('\n'),
    type: 'text',
    required: true,
    validator: v => v.trim().split(/\s+/).length < 10 ? 'Can you expand a bit more? At least 10 words helps us understand better.' : null,
    scoreWeight: 10,
  },
  {
    key: 'solution_summary',
    message: `${T.thanks}\n\nAnd how does your product solve that problem? What makes your approach unique?`,
    type: 'text',
    required: true,
    validator: v => v.trim().split(/\s+/).length < 10 ? 'Please share a bit more about your solution.' : null,
    scoreWeight: 10,
  },

  // ── MVP & TRACTION ───────────────────────────────────────────────────────
  {
    key: 'mvp_status',
    message: `${T.love}\n\nLet's talk about your product. 🛠️\n\nWhere are you in building it?`,
    type: 'select',
    required: true,
    options: ['Just an idea', 'Prototype / Demo', 'Beta / Early users', 'Live product'],
    scoreWeight: 15,
  },
  {
    key: 'active_users',
    message: ctx => {
      if (ctx.mvp_status === 'Just an idea') {
        return `${T.noted}\n\nEven at the idea stage, have you had any early conversations with potential users? How many people have shown interest?`;
      }
      if (ctx.mvp_status === 'Prototype / Demo') {
        return `${T.great} A working prototype is a great start!\n\nHow many people have you shown it to or are testing it?`;
      }
      return `${T.awesome} You have a live product — that's a real milestone!\n\nHow many active users or customers do you have right now?`;
    },
    type: 'number',
    required: true,
    validator: v => isNaN(Number(v)) || Number(v) < 0 ? 'Please enter a number (enter 0 if none yet).' : null,
    scoreWeight: 12,
  },
  {
    key: 'monthly_revenue',
    message: ctx => {
      const users = Number(ctx.active_users);
      if (users === 0) return "What's your current Monthly Recurring Revenue (MRR) in USD? Enter 0 if pre-revenue — totally fine at this stage!";
      return `Nice — ${users} ${users === 1 ? 'user' : 'users'}! 📈\n\nWhat's your current Monthly Recurring Revenue (MRR) in USD? Enter 0 if pre-revenue.`;
    },
    type: 'number',
    required: true,
    scoreWeight: 12,
  },
  {
    key: 'growth_rate_pct',
    message: ctx => {
      const rev = Number(ctx.monthly_revenue);
      if (rev > 0) return `💰 ${rev > 0 ? `$${rev.toLocaleString()} MRR — ` : ''}great momentum!\n\nWhat's your Month-over-Month growth rate? (Enter a number, e.g. 15 for 15%)`;
      return "What's your Month-over-Month growth rate on users? (Enter %, e.g. 20 for 20%)";
    },
    type: 'number',
    required: false,
    skipIf: ctx => Number(ctx.active_users) === 0,
    scoreWeight: 8,
  },

  // ── TEAM ─────────────────────────────────────────────────────────────────
  {
    key: 'team_size',
    message: `${T.perfect}\n\nLet's talk about your team. 👥\n\nHow many people are on your core team right now (including co-founders)?`,
    type: 'number',
    required: true,
    validator: v => Number(v) < 1 ? 'Team size must be at least 1.' : null,
    scoreWeight: 5,
  },
  {
    key: 'has_technical_cofounder',
    message: ctx => `A team of ${ctx.team_size}! Do you have a technical co-founder or a strong in-house engineer?`,
    type: 'boolean',
    required: true,
    scoreWeight: 5,
  },

  // ── FUNDING ───────────────────────────────────────────────────────────────
  {
    key: 'funding_stage',
    message: `${T.great}\n\nNow let's talk funding. 💸\n\nWhat stage are you currently at?`,
    type: 'select',
    required: true,
    options: ['Bootstrapped', 'Friends & Family', 'Pre-Seed', 'Seed', 'Series A+'],
    scoreWeight: 5,
  },
  {
    key: 'amount_raising_usd',
    message: "How much are you raising in this round? (USD)",
    type: 'number',
    required: true,
    scoreWeight: 4,
  },
  {
    key: 'use_of_funds',
    message: ctx => `Got it — $${Number(ctx.amount_raising_usd).toLocaleString()}. What will this funding help you achieve? (e.g. hire engineers, reach PMF, expand to new markets)`,
    type: 'text',
    required: true,
    scoreWeight: 4,
  },

  // ── VALIDATION ────────────────────────────────────────────────────────────
  {
    key: 'has_paying_customers',
    message: `${T.noted}\n\nAlmost done! One of the most important signals 💰\n\nDo you have any paying customers, signed LOIs, or active pilot partners?`,
    type: 'boolean',
    required: true,
    scoreWeight: 10,
  },
  {
    key: 'customer_testimonials',
    message: "That's fantastic — paying customers this early is a strong signal! 🎉\n\nCare to share a quick win or testimonial? (Even something like \"Acme Corp is saving 10 hrs/week\" works perfectly.)",
    type: 'text',
    required: false,
    skipIf: ctx => ctx.has_paying_customers === false,
    scoreWeight: 5,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// INVESTOR FLOW
// ────────────────────────────────────────────────────────────────────────────

const INVESTOR_FLOW = [
  // ── INTRO ────────────────────────────────────────────────────────────────
  {
    key: 'full_name',
    message: [
      "👋 Welcome to LeadLens!",
      "",
      "We connect investors with high-potential early-stage founders.",
      "",
      "A few quick questions and we'll understand how you invest. What's your full name?",
    ].join('\n'),
    type: 'text',
    required: true,
    validator: v => v.trim().length < 2 ? 'Please enter your full name.' : null,
  },
  {
    key: 'email',
    message: ctx => `${T.great} Great to meet you, ${ctx.full_name.split(' ')[0]}! 🤝\n\nWhat's your email address?`,
    type: 'email',
    required: true,
  },
  {
    key: 'phone',
    message: "Your phone number? (Optional — include country code if you share it)",
    type: 'phone',
    required: false,
  },
  {
    key: 'firm_name',
    message: "What's the name of your firm or fund?\n\n(Type \"Independent\" if you invest as an angel.)",
    type: 'text',
    required: true,
    scoreWeight: 5,
  },
  {
    key: 'linkedin_url',
    message: "Your LinkedIn URL? Helps us validate your background. (Optional)",
    type: 'url',
    required: false,
  },

  // ── THESIS ───────────────────────────────────────────────────────────────
  {
    key: 'thesis_summary',
    message: ctx => [
      `${T.perfect} ${ctx.firm_name} — noted!`,
      "",
      "Now the most important question: 🧠",
      "",
      "How do you invest? Describe your thesis in 2–3 sentences — what kinds of founders, problems, or markets get you excited?",
    ].join('\n'),
    type: 'text',
    required: true,
    validator: v => v.trim().split(/\s+/).length < 8 ? 'Please tell us a bit more about your investment thesis.' : null,
    scoreWeight: 15,
  },
  {
    key: 'preferred_sectors',
    message: `${T.love}\n\nWhich sectors do you prefer to invest in? Select all that apply.`,
    type: 'multiselect',
    required: true,
    options: [
      'SaaS / B2B Software',
      'Fintech',
      'Healthtech',
      'Edtech',
      'Climate / Sustainability',
      'DeepTech / AI',
      'Consumer',
      'E-commerce',
      'Agnostic',
    ],
    scoreWeight: 10,
  },

  // ── STAGE & CHEQUE ────────────────────────────────────────────────────────
  {
    key: 'stage_focus',
    message: "Which funding stages do you actively invest in?",
    type: 'multiselect',
    required: true,
    options: ['Pre-Seed', 'Seed', 'Series A', 'Series B+'],
    scoreWeight: 15,
  },
  {
    key: 'typical_cheque_usd',
    message: `${T.noted}\n\nWhat's your typical cheque size per deal in USD?`,
    type: 'number',
    required: true,
    validator: v => Number(v) <= 0 ? 'Please enter a positive amount.' : null,
    scoreWeight: 10,
  },
  {
    key: 'min_cheque_usd',
    message: "What's the minimum cheque you'd write? (Optional)",
    type: 'number',
    required: false,
    scoreWeight: 3,
  },
  {
    key: 'max_cheque_usd',
    message: "And the maximum? (Optional)",
    type: 'number',
    required: false,
    scoreWeight: 3,
  },

  // ── PORTFOLIO ─────────────────────────────────────────────────────────────
  {
    key: 'portfolio_size',
    message: `${T.great}\n\nHow many portfolio companies do you currently have?`,
    type: 'number',
    required: true,
    scoreWeight: 8,
  },
  {
    key: 'notable_investments',
    message: ctx => {
      if (Number(ctx.portfolio_size) === 0) return "Any investments in progress or recent ones you'd like to highlight? (Optional)";
      return `${Number(ctx.portfolio_size)} companies — impressive! 🌟\n\nAny notable investments you'd like to highlight? (Company names are fine)`;
    },
    type: 'text',
    required: false,
    scoreWeight: 5,
  },
  {
    key: 'geography_focus',
    message: "Which geographies do you focus on?",
    type: 'multiselect',
    required: true,
    options: ['India', 'South Asia', 'Southeast Asia', 'USA', 'Europe', 'Global / Agnostic'],
    scoreWeight: 5,
  },

  // ── SUPPORT & INVOLVEMENT ─────────────────────────────────────────────────
  {
    key: 'support_type',
    message: `${T.perfect}\n\nBeyond capital, what value do you bring to your portfolio companies? Select all that apply.`,
    type: 'multiselect',
    required: true,
    options: [
      'Strategic mentorship',
      'Network access',
      'Business development',
      'Hiring support',
      'Follow-on capital',
      'Capital only',
    ],
    scoreWeight: 8,
  },
  {
    key: 'involvement_level',
    message: "How hands-on are you post-investment?",
    type: 'select',
    required: true,
    options: [
      'Passive (capital only)',
      'Light-touch (quarterly check-ins)',
      'Active (monthly)',
      'Hands-on (board seat)',
    ],
    scoreWeight: 5,
  },

  // ── DEPLOYMENT ────────────────────────────────────────────────────────────
  {
    key: 'deployment_timeline',
    message: `${T.noted}\n\nLast section — timing! ⚡\n\nWhen are you looking to make your next investment?`,
    type: 'select',
    required: true,
    options: ['Immediately', 'Within 3 months', 'Within 6 months', 'Within 12 months'],
    scoreWeight: 8,
  },
  {
    key: 'num_deals_per_year',
    message: "How many new investments do you typically make per year?",
    type: 'number',
    required: true,
    scoreWeight: 5,
  },
];

module.exports = { FOUNDER_FLOW, INVESTOR_FLOW };
