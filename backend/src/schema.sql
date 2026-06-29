-- ============================================================
-- LeadLens Lead Qualification DB Schema
-- PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------
-- ENUM TYPES
-- -------------------------------------------------------
CREATE TYPE lead_type AS ENUM ('founder', 'investor');

CREATE TYPE lead_status AS ENUM (
  'hot',     -- 80-100
  'good',    -- 60-79
  'maybe',   -- 40-59
  'low'      -- 0-39
);

CREATE TYPE session_state AS ENUM (
  'in_progress',
  'completed',
  'abandoned'
);

-- -------------------------------------------------------
-- CHAT SESSIONS
-- -------------------------------------------------------
CREATE TABLE chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type       lead_type,
  state           session_state NOT NULL DEFAULT 'in_progress',
  current_step    INT NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  ip_address      INET,
  user_agent      TEXT,
  metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_sessions_state      ON chat_sessions(state);
CREATE INDEX idx_sessions_started_at ON chat_sessions(started_at DESC);
CREATE INDEX idx_sessions_lead_type  ON chat_sessions(lead_type);

-- -------------------------------------------------------
-- RAW CONVERSATION MESSAGES
-- -------------------------------------------------------
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('bot', 'user')),
  content     TEXT NOT NULL,
  step_key    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON chat_messages(session_id, created_at);

-- -------------------------------------------------------
-- FOUNDER LEADS
-- -------------------------------------------------------
CREATE TABLE founder_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL UNIQUE REFERENCES chat_sessions(id) ON DELETE CASCADE,

  -- Personal & Contact
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  linkedin_url        TEXT,

  -- Background
  role_in_startup     TEXT,
  years_experience    INT,

  -- Problem & Solution
  startup_name        TEXT,
  industry            TEXT,
  problem_statement   TEXT,
  solution_summary    TEXT,

  -- MVP & Traction
  mvp_status          TEXT,   -- 'idea'|'prototype'|'beta'|'live'
  monthly_revenue     NUMERIC(12,2),
  active_users        INT,
  growth_rate_pct     NUMERIC(5,2),

  -- Team
  team_size           INT,
  has_technical_cofounder BOOLEAN,
  key_team_highlights TEXT,

  -- Funding
  funding_stage       TEXT,   -- 'pre-seed'|'seed'|'series-a'
  amount_raising_usd  NUMERIC(14,2),
  use_of_funds        TEXT,
  previous_funding    NUMERIC(14,2) DEFAULT 0,

  -- Validation
  has_paying_customers BOOLEAN,
  customer_testimonials TEXT,
  pilot_partners      TEXT,

  -- Score
  score               INT CHECK (score BETWEEN 0 AND 100),
  status              lead_status,
  score_breakdown     JSONB DEFAULT '{}',
  internal_notes      TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_founder_score   ON founder_leads(score DESC);
CREATE INDEX idx_founder_status  ON founder_leads(status);
CREATE INDEX idx_founder_email   ON founder_leads(email);
CREATE INDEX idx_founder_created ON founder_leads(created_at DESC);

-- -------------------------------------------------------
-- INVESTOR LEADS
-- -------------------------------------------------------
CREATE TABLE investor_leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL UNIQUE REFERENCES chat_sessions(id) ON DELETE CASCADE,

  -- Personal & Contact
  full_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT,
  linkedin_url          TEXT,
  firm_name             TEXT,

  -- Investment Thesis
  thesis_summary        TEXT,
  preferred_sectors     TEXT[],
  excluded_sectors      TEXT[],

  -- Stage & Cheque
  stage_focus           TEXT[],  -- ['pre-seed','seed','series-a']
  min_cheque_usd        NUMERIC(14,2),
  max_cheque_usd        NUMERIC(14,2),
  typical_cheque_usd    NUMERIC(14,2),

  -- Portfolio
  portfolio_size        INT,
  notable_investments   TEXT,
  geography_focus       TEXT[],

  -- Support Model
  support_type          TEXT[],  -- ['capital','mentorship','network','bd']
  board_seat_interest   BOOLEAN,
  involvement_level     TEXT,    -- 'passive'|'active'|'lead'

  -- Deployment
  deployment_timeline   TEXT,    -- 'immediate'|'3-months'|'6-months'|'12-months'
  dry_powder_usd        NUMERIC(14,2),
  num_deals_per_year    INT,

  -- Score
  score                 INT CHECK (score BETWEEN 0 AND 100),
  status                lead_status,
  score_breakdown       JSONB DEFAULT '{}',
  internal_notes        TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investor_score   ON investor_leads(score DESC);
CREATE INDEX idx_investor_status  ON investor_leads(status);
CREATE INDEX idx_investor_email   ON investor_leads(email);
CREATE INDEX idx_investor_created ON investor_leads(created_at DESC);

-- -------------------------------------------------------
-- AUTO-UPDATE updated_at
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_founder_updated_at
  BEFORE UPDATE ON founder_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_investor_updated_at
  BEFORE UPDATE ON investor_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------
-- ANALYTICS VIEW
-- -------------------------------------------------------
CREATE VIEW lead_overview AS
  SELECT
    'founder'      AS type,
    id,
    full_name,
    email,
    score,
    status,
    created_at
  FROM founder_leads
  UNION ALL
  SELECT
    'investor'     AS type,
    id,
    full_name,
    email,
    score,
    status,
    created_at
  FROM investor_leads
  ORDER BY created_at DESC;
