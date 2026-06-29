# LeadLens — Founder & Investor Intake Platform

> A full-stack conversational chatbot that qualifies inbound enquiries from founders and investors, scores them 0–100, and surfaces them on a live ERP dashboard for the LeadLens team.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Architecture Overview](#architecture-overview)
- [Tech Stack & Rationale](#tech-stack--rationale)
- [Features](#features)
- [Setup & Installation](#setup--installation)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Scoring Engine](#scoring-engine)
- [Conversation Flows](#conversation-flows)
- [Deployment](#deployment)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Live Demo

| Surface     | URL                              |
|-------------|----------------------------------|
| Chatbot     | `https://leadlens.vercel.app/` |
| Dashboard   | `https://leadlens.vercel.app/dashboard` |
| API Health  | `https://leadlens-api.railway.app/health` |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│                                                      │
│  ┌──────────────────┐   ┌──────────────────────────┐ │
│  │   Chatbot UI     │   │   Dashboard (ERP)        │ │
│  │  React + Tailwind│   │   React + Recharts       │ │
│  └────────┬─────────┘   └────────────┬─────────────┘ │
└───────────┼────────────────────────  ┼ ──────────────┘
            │ REST API (JSON)          │
            ▼                         ▼
┌──────────────────────────────────────────────────────┐
│              Node.js / Express API                   │
│                                                      │
│  /api/chat     – session & message management        │
│  /api/leads    – lead CRUD + notes                  │
│  /api/dashboard – aggregated analytics               │
│                                                      │
│  ┌───────────────┐  ┌────────────────┐               │
│  │ Conversation  │  │ Scoring Engine │               │
│  │ Flow Engine   │  │ (0-100 score)  │               │
│  └───────────────┘  └────────────────┘               │
└────────────────────────────┬─────────────────────────┘
                             │ pg (connection pool)
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │  (Railway)      │
                    │                 │
                    │  chat_sessions  │
                    │  chat_messages  │
                    │  founder_leads  │
                    │  investor_leads │
                    └─────────────────┘
```

---

## Tech Stack & Rationale

| Layer       | Choice                  | Why                                                                                  |
|-------------|-------------------------|--------------------------------------------------------------------------------------|
| Frontend    | React 18                | Component model maps cleanly to chat bubbles; hooks simplify async state management  |
| Styling     | Tailwind CSS            | Utility-first = rapid iteration without style conflicts; purge keeps bundle small     |
| Charts      | Recharts                | Built on D3 but React-native API; lightweight for basic bar/line charts in dashboard |
| Backend     | Node.js + Express       | Non-blocking I/O suits chat (many short requests); express-validator for safety       |
| Database    | PostgreSQL               | JSONB for flexible score breakdowns; strong typing for lead fields; SQL views for analytics |
| Rate Limiting | express-rate-limit    | Protects chat endpoint from spam; bot abuse is a real concern for embedded widgets    |
| Security    | Helmet                  | Sets secure HTTP headers out of the box                                               |
| Deploy FE   | Vercel                  | Zero-config CRA deploy; CDN globally distributed; preview URLs on every PR            |
| Deploy BE   | Railway                 | Supports Node + PostgreSQL in one project; automated DB backups                       |
| Testing     | Jest + Supertest        | Fast unit tests for scoring logic; integration tests for routes without a real DB     |

---

## Features

### Chatbot
- **Dual persona flows** — Founder (20 questions) and Investor (18 questions), each tuned to their data profile
- **Smart skip logic** — questions conditionally skipped based on prior answers (e.g. skip "growth rate" if users = 0)
- **Real-time validation** — email, phone, URL, number, boolean types validated server-side with clear error messages and retry
- **Multi-select support** — sectors, geographies, support types allow multiple selections with visual pills
- **Typing indicator** — animated dots while waiting for server response
- **Progress bar** — shows how far through the flow the user is
- **Animated message bubbles** — slide-up entrance for a polished feel
- **Completion screen** — shows personalised closing message + score breakdown gauge

### Dashboard (ERP)
- **Summary KPIs** — total leads, average score, hot count, good count
- **Filterable table** — filter by type, status, free-text search by name/email
- **Sortable pagination** — 15 leads per page
- **Lead detail modal** — click any row to see full profile, score breakdown bars, and editable internal notes
- **Notes auto-save** — team members can annotate leads with internal notes

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repo

```bash
git clone https://github.com/your-username/leadlens-chatbot.git
cd leadlens-chatbot
```

### 2. Set up the database

```bash
# Create the database
createdb leadlens

# Run the schema migration
psql leadlens < backend/src/schema.sql
```

### 3. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API URL
```

### 4. Install dependencies & run

```bash
# Backend
cd backend
npm install
npm run dev    # runs on http://localhost:4000

# Frontend (new terminal)
cd frontend
npm install
npm start      # runs on http://localhost:3000
```

### 5. Run tests

```bash
cd backend
npm test
```

---

## API Documentation

### Base URL
`http://localhost:4000/api`

---

### `POST /chat/start`
Start a new chat session.

**Request Body**
```json
{ "lead_type": "founder" }
```
`lead_type`: `"founder"` | `"investor"`

**Response `200`**
```json
{
  "session_id": "uuid-v4",
  "lead_type": "founder",
  "step": 0,
  "total_steps": 20,
  "question": "👋 Welcome to LeadLens!...",
  "step_key": "full_name",
  "type": "text",
  "options": null,
  "required": true,
  "progress": 0
}
```

---

### `POST /chat/message`
Send a user's answer; receive the next question or final result.

**Request Body**
```json
{
  "session_id": "uuid-v4",
  "value": "Priya Sharma"
}
```

**Response `200` — mid-flow**
```json
{
  "completed": false,
  "step": 1,
  "total_steps": 20,
  "question": "Great to meet you, Priya! 🎉\n\nWhat's your email address?",
  "step_key": "email",
  "type": "email",
  "options": null,
  "required": true,
  "progress": 5
}
```

**Response `200` — completed**
```json
{
  "completed": true,
  "score": 82,
  "status": "hot",
  "breakdown": {
    "problem_clarity": 13,
    "mvp_maturity": 20,
    "traction": 18,
    "team_strength": 13,
    "funding_readiness": 9,
    "validation_evidence": 9
  },
  "closing_message": "🔥 Amazing, Priya!..."
}
```

**Response `422` — validation error**
```json
{
  "error": "Please enter a valid email address.",
  "retry": true
}
```

---

### `GET /chat/session/:id`
Retrieve full session with all messages.

---

### `GET /leads`
List leads with filtering and pagination.

**Query Parameters**
| Param    | Type   | Default     | Description                    |
|----------|--------|-------------|--------------------------------|
| type     | string | all         | `founder` or `investor`        |
| status   | string | all         | `hot`, `good`, `maybe`, `low`  |
| search   | string | —           | Free-text on name/email        |
| page     | int    | 1           | Page number                    |
| limit    | int    | 20          | Results per page               |
| sort_by  | string | created_at  | `score`, `full_name`, `created_at` |
| sort_dir | string | desc        | `asc` or `desc`                |

---

### `GET /leads/:type/:id`
Retrieve a single lead with full profile.

---

### `PATCH /leads/:type/:id/notes`
Update internal notes for a lead.

**Request Body**
```json
{ "internal_notes": "Strong team, needs more traction clarity. Follow up in 2 weeks." }
```

---

### `GET /dashboard/stats`
Returns aggregated analytics.

**Response**
```json
{
  "total_leads": 124,
  "average_score": 58,
  "by_status": [
    { "status": "hot", "count": "23" },
    { "status": "good", "count": "41" }
  ],
  "by_type": [
    { "type": "founder", "count": "89", "avg_score": "61" }
  ],
  "recent_leads": [...],
  "weekly_trend": [...],
  "funnel": {
    "total_sessions": 189,
    "completed": 124,
    "abandoned": 65
  }
}
```

---

## Database Schema

### Tables

| Table            | Purpose                                      |
|------------------|----------------------------------------------|
| `chat_sessions`  | Tracks each conversation (state machine)     |
| `chat_messages`  | Raw message log (bot + user turns)           |
| `founder_leads`  | Structured founder profile + score           |
| `investor_leads` | Structured investor profile + score          |
| `lead_overview`  | UNION view for easy cross-type analytics     |

### Key Design Decisions

- **`JSONB` for `score_breakdown`** — individual dimension scores are flexible and don't need their own columns
- **`ENUM` types** — `lead_type`, `lead_status`, `session_state` enforce valid values at DB level
- **Auto-update trigger** — `updated_at` is maintained by a PostgreSQL trigger, not application logic
- **Connection pooling** — `pg.Pool` with max 10 connections prevents overloading Railway's DB

---

## Scoring Engine

### Founder Dimensions (100 pts total)

| Dimension            | Max | Key Signals                                         |
|----------------------|-----|-----------------------------------------------------|
| Problem Clarity      |  15 | Word count of problem + solution statements         |
| MVP Maturity         |  20 | Idea → Prototype → Beta → Live (5/10/16/20 pts)    |
| Traction             |  25 | Users (0–10) + Revenue (0–10) + Growth rate (0–5)  |
| Team Strength        |  15 | Size + technical co-founder + founder role          |
| Funding Readiness    |  10 | Funding stage + articulated use of funds            |
| Validation Evidence  |  15 | Paying customers + testimonials                     |

### Investor Dimensions (100 pts total)

| Dimension            | Max | Key Signals                                         |
|----------------------|-----|-----------------------------------------------------|
| Thesis Alignment     |  20 | Clarity and depth of investment thesis              |
| Stage Match          |  20 | Early stage focus (Pre-Seed/Seed rewarded)          |
| Cheque Fit           |  15 | Typical cheque size (≥$100k = strong)               |
| Portfolio Experience |  15 | Number of investments + notable companies           |
| Support Value        |  15 | Breadth of non-capital support offered              |
| Deployment Urgency   |  15 | Immediacy of next deployment (Immediately = 15 pts) |

### Score Buckets

| Score   | Status | Action                        |
|---------|--------|-------------------------------|
| 80–100  | Hot 🔥 | Immediate outreach + program  |
| 60–79   | Good ✅ | Standard follow-up (3–5 days) |
| 40–59   | Maybe 🤔 | Request clarification        |
| 0–39    | Low 📋 | Polite rejection              |

---

## Conversation Flows

### Founder Flow (20 steps)

```
1.  full_name           → text
2.  email               → email
3.  phone               → phone (optional)
4.  linkedin_url        → url (optional)
5.  role_in_startup     → select
6.  startup_name        → text
7.  industry            → select
8.  problem_statement   → text (≥10 words)
9.  solution_summary    → text (≥10 words)
10. mvp_status          → select
11. active_users        → number
12. monthly_revenue     → number
13. growth_rate_pct     → number [skip if active_users=0]
14. team_size           → number
15. has_technical_cofounder → boolean
16. funding_stage       → select
17. amount_raising_usd  → number
18. use_of_funds        → text
19. has_paying_customers → boolean
20. customer_testimonials → text (optional) [skip if no paying customers]
```

### Investor Flow (18 steps)

```
1.  full_name          → text
2.  email              → email
3.  phone              → phone (optional)
4.  firm_name          → text
5.  linkedin_url       → url (optional)
6.  thesis_summary     → text (≥8 words)
7.  preferred_sectors  → multiselect
8.  stage_focus        → multiselect
9.  typical_cheque_usd → number
10. min_cheque_usd     → number (optional)
11. max_cheque_usd     → number (optional)
12. portfolio_size     → number
13. notable_investments → text (optional)
14. geography_focus    → multiselect
15. support_type       → multiselect
16. involvement_level  → select
17. deployment_timeline → select
18. num_deals_per_year → number
```

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Push to GitHub; connect repo in Vercel dashboard
# Set REACT_APP_API_URL in Vercel environment variables
```

### Backend → Railway

```bash
# Create Railway project
# Connect GitHub repo
# Set environment variables:
#   NODE_ENV=production
#   DATABASE_URL=<auto-provided by Railway PostgreSQL plugin>
#   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
#   PORT=4000 (Railway handles this automatically)
```

---

## Testing

```bash
cd backend
npm test
```

**Test suite covers:**
- `scoreLabel()` – all four bucket boundaries
- `scoreFounder()` – strong vs. weak founder; dimension coverage; score clamp 0–100
- `scoreInvestor()` – strong vs. passive investor; breakdown keys; monotonicity

---

## Project Structure

```
leadlens/
├── backend/
│   ├── src/
│   │   ├── index.js                  # Entry point
│   │   ├── app.js                    # Express app + middleware
│   │   ├── schema.sql                # PostgreSQL schema
│   │   ├── routes/
│   │   │   ├── chat.js               # /api/chat endpoints
│   │   │   ├── leads.js              # /api/leads endpoints
│   │   │   └── dashboard.js          # /api/dashboard endpoints
│   │   ├── services/
│   │   │   ├── conversationFlow.js   # Question definitions + skip logic
│   │   │   └── scoringEngine.js      # Scoring algorithms
│   │   ├── middleware/
│   │   │   └── errorHandler.js       # Centralised error handling
│   │   └── utils/
│   │       └── db.js                 # pg connection pool
│   └── tests/
│       └── scoring.test.js           # Jest unit tests
│
└── frontend/
    └── src/
        ├── App.jsx                   # Router
        ├── index.css                 # Tailwind + custom animations
        ├── utils/
        │   └── api.js                # Typed API client
        └── components/
            ├── chatbot/
            │   └── Chatbot.jsx       # Full chatbot UI
            └── dashboard/
                └── Dashboard.jsx     # ERP dashboard
```
