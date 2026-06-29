# LeadLens — Complete VSCode Setup Guide

> Follow these steps in order. By the end you'll have the chatbot running at `localhost:3000` and the dashboard at `localhost:3000/dashboard`.

---

## Prerequisites — Install These First

Before touching the project, make sure these are installed on your machine.

### 1. Node.js (v18 or higher)
Check if installed:
```bash
node -v
```
If not installed → download from https://nodejs.org (choose **LTS** version)

### 2. PostgreSQL (v14 or higher)
Check if installed:
```bash
psql --version
```
If not installed:
- **Windows**: Download from https://www.postgresql.org/download/windows/ — use the installer, remember the password you set for the `postgres` user
- **Mac**: `brew install postgresql@16` then `brew services start postgresql@16`
- **Linux (Ubuntu/Debian)**: `sudo apt install postgresql postgresql-contrib`

### 3. Git
```bash
git --version
```
If not installed → https://git-scm.com/downloads

### 4. VSCode
https://code.visualstudio.com/

---

## Step 1 — Open the Project in VSCode

If you received the project as a zip:
1. Extract the zip somewhere (e.g. `~/Projects/leadlens`)
2. Open VSCode
3. `File → Open Folder` → select the `leadlens` folder
4. You'll see `backend/`, `frontend/`, `docs/`, `README.md` in the Explorer panel

**Better: use the workspace file**
```
File → Open Workspace from File → select leadlens.code-workspace
```
This opens backend and frontend as separate workspace folders, which helps VSCode give you the right IntelliSense in each.

---

## Step 2 — Install Recommended VSCode Extensions

When you open the workspace, VSCode may show a popup "Do you want to install the recommended extensions?" → click **Install All**.

If not, open the Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`) and install:

| Extension | Why |
|-----------|-----|
| **Tailwind CSS IntelliSense** | Autocomplete for Tailwind classes |
| **ES7+ React/Redux/React-Native snippets** | `rafce` → instant component boilerplate |
| **Prettier - Code formatter** | Auto-format on save |
| **SQLTools** + **SQLTools PostgreSQL Driver** | Run SQL directly in VSCode |
| **Path IntelliSense** | Autocomplete for `../utils/api` style imports |
| **Material Icon Theme** | Makes the file tree much easier to read |

---

## Step 3 — Set Up the Database

### 3a. Start PostgreSQL

- **Windows**: PostgreSQL service starts automatically. Open **pgAdmin** (installed with PostgreSQL) OR use the terminal.
- **Mac**: `brew services start postgresql@16`
- **Linux**: `sudo service postgresql start`

### 3b. Open a terminal in VSCode

`Terminal → New Terminal` (or `` Ctrl+` ``)

### 3c. Create the database

```bash
# Connect as the postgres superuser
psql -U postgres

# Inside psql, run:
CREATE DATABASE leadlens;
\q
```

**Windows alternative:** If `psql` isn't in your PATH, find it in `C:\Program Files\PostgreSQL\16\bin\psql.exe` and add that folder to your system PATH, then restart the terminal.

### 3d. Run the schema migration

```bash
psql -U postgres -d leadlens -f backend/src/schema.sql
```

You should see output like:
```
CREATE EXTENSION
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TABLE
...
CREATE VIEW
```

**Verify it worked:**
```bash
psql -U postgres -d leadlens -c "\dt"
```
Expected output:
```
         List of relations
 Schema |     Name      | Type  |  Owner
--------+---------------+-------+----------
 public | chat_messages | table | postgres
 public | chat_sessions | table | postgres
 public | founder_leads | table | postgres
 public | investor_leads| table | postgres
```

---

## Step 4 — Configure Environment Variables

### Backend `.env`

Open `backend/.env` in VSCode. It looks like this:

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leadlens
ALLOWED_ORIGINS=http://localhost:3000
```

**You must update `DATABASE_URL`** to match your PostgreSQL setup:

```
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/leadlens
```

- `USERNAME` → usually `postgres`
- `PASSWORD` → the password you set during PostgreSQL installation
- `5432` → default PostgreSQL port (keep this)
- `leadlens` → the database name you created in Step 3

**Examples:**
```bash
# Mac (Homebrew, no password set):
DATABASE_URL=postgresql://postgres@localhost:5432/leadlens

# Windows (password is "mypassword"):
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/leadlens

# Linux (default setup):
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leadlens
```

### Frontend `.env`

Open `frontend/.env`. It should already be correct:

```
REACT_APP_API_URL=http://localhost:4000/api
```

Leave this as-is for local development.

---

## Step 5 — Install Node Dependencies

Open two terminal tabs in VSCode (click the `+` icon in the terminal panel).

### Terminal 1 — Backend

```bash
cd backend
npm install
```

Wait for it to finish. You'll see a `node_modules/` folder appear under `backend/`.

### Terminal 2 — Frontend

```bash
cd frontend
npm install
```

This takes 1–3 minutes (React projects have many dependencies). Wait for it fully.

---

## Step 6 — Run the Project

Keep both terminals open. You'll run two servers side by side.

### Terminal 1 — Start the Backend API

```bash
cd backend
npm run dev
```

Expected output:
```
[nodemon] starting `node src/index.js`

🚀 LeadLens API running on port 4000
   ENV: development
```

**Test it's working:** Open your browser at `http://localhost:4000/health`

You should see:
```json
{ "status": "ok", "ts": "2025-01-15T10:30:00.000Z" }
```

### Terminal 2 — Start the Frontend

```bash
cd frontend
npm start
```

This opens `http://localhost:3000` in your browser automatically. First start takes ~30 seconds.

Expected output:
```
Compiled successfully!

You can now view leadlens-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

## Step 7 — Verify Everything Works

### Chatbot: `http://localhost:3000`
- You should see the LeadLens landing page with two cards: "I'm a Founder" and "I'm an Investor"
- Click "I'm a Founder" → the chat should start
- Answer a few questions → verify the progress bar moves
- Complete the whole flow → you should see a score ring and breakdown

### Dashboard: `http://localhost:3000/dashboard`
- You should see the dashboard with KPI cards (likely all zeros until you complete a chat)
- Complete a founder chat, then refresh the dashboard → the lead appears in the table
- Click the lead row → a detail modal opens

### Tests:
```bash
cd backend
npm test
```
All 16 tests should pass:
```
Tests: 16 passed, 16 total
```

---

## Step 8 — VSCode Shortcuts for This Project

| Action | Shortcut |
|--------|----------|
| Open terminal | `` Ctrl+` `` (backtick) |
| Split terminal | `Ctrl+Shift+5` |
| Open file quickly | `Ctrl+P` → type filename |
| Search all files | `Ctrl+Shift+F` |
| Format file | `Shift+Alt+F` |
| Go to definition | `F12` |
| Rename symbol | `F2` |
| Run VS Code task | `Ctrl+Shift+P` → "Run Task" |

---

## Troubleshooting

### "Cannot connect to PostgreSQL" / `ECONNREFUSED`

The database isn't running or your `DATABASE_URL` is wrong.

```bash
# Check PostgreSQL is running:
# Mac:
brew services list | grep postgresql

# Linux:
sudo service postgresql status

# Windows: Check Services app (Win+R → services.msc → look for "postgresql-x64-16")

# Test your connection manually:
psql "postgresql://postgres:yourpassword@localhost:5432/leadlens"
```

### `password authentication failed for user "postgres"`

Your password in `DATABASE_URL` is wrong. Reset it:
```bash
# In psql as superuser:
psql -U postgres
ALTER USER postgres PASSWORD 'newpassword';
\q
# Then update DATABASE_URL with the new password
```

### `relation "chat_sessions" does not exist`

Schema migration wasn't run against the right database.
```bash
psql -U postgres -d leadlens -f backend/src/schema.sql
```

### Port 4000 already in use

```bash
# Find what's using port 4000:
# Mac/Linux:
lsof -i :4000
# Windows:
netstat -ano | findstr :4000

# Kill it (Mac/Linux):
kill -9 <PID>
```

Or change `PORT=4001` in `backend/.env` and update `REACT_APP_API_URL=http://localhost:4001/api` in `frontend/.env`.

### Port 3000 already in use

CRA will ask: "Would you like to run on port 3001?" → press `Y`. Then update `ALLOWED_ORIGINS=http://localhost:3001` in `backend/.env` and restart the backend.

### `npm install` fails with Python/node-gyp errors

Some packages need build tools:
```bash
# Windows:
npm install --global windows-build-tools

# Mac:
xcode-select --install

# Linux:
sudo apt-get install -y build-essential
```

### CORS error in browser console

Make sure `ALLOWED_ORIGINS` in `backend/.env` exactly matches the frontend URL (including `http://` and no trailing slash).

---

## Project File Map (Quick Reference)

```
leadlens/
│
├── leadlens.code-workspace    ← Open this in VSCode
├── .gitignore
├── README.md
│
├── backend/
│   ├── .env                   ← Edit DATABASE_URL here
│   ├── .env.example           ← Template
│   ├── package.json
│   ├── nodemon.json
│   ├── src/
│   │   ├── index.js           ← Server entry point
│   │   ├── app.js             ← Express setup + middleware
│   │   ├── schema.sql         ← PostgreSQL schema (run once)
│   │   ├── routes/
│   │   │   ├── chat.js        ← /api/chat/* endpoints
│   │   │   ├── leads.js       ← /api/leads/* endpoints
│   │   │   └── dashboard.js   ← /api/dashboard/stats
│   │   ├── services/
│   │   │   ├── conversationFlow.js  ← All chat questions defined here
│   │   │   └── scoringEngine.js     ← 0–100 scoring logic
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── utils/
│   │       └── db.js          ← PostgreSQL connection pool
│   └── tests/
│       └── scoring.test.js    ← 16 unit tests
│
├── frontend/
│   ├── .env                   ← REACT_APP_API_URL
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js           ← React entry point
│       ├── App.jsx            ← Router (/ and /dashboard)
│       ├── index.css          ← Tailwind directives
│       ├── utils/
│       │   └── api.js         ← All API calls in one place
│       └── components/
│           ├── chatbot/
│           │   └── Chatbot.jsx      ← Full chat UI
│           └── dashboard/
│               └── Dashboard.jsx    ← ERP dashboard
│
└── docs/
    ├── API.md                 ← Full API documentation
    └── INTERVIEW_PREP.md      ← Deep-dive for demo prep
```

---

## Quick-Start Cheatsheet (Bookmark This)

```bash
# ── Every time you want to run LeadLens ──────────────────

# Terminal 1 — Backend
cd leadlens/backend
npm run dev
# → API live at http://localhost:4000

# Terminal 2 — Frontend
cd leadlens/frontend
npm start
# → App live at http://localhost:3000

# ── One-time setup only ──────────────────────────────────
psql -U postgres -c "CREATE DATABASE leadlens;"
psql -U postgres -d leadlens -f backend/src/schema.sql

# ── Tests ───────────────────────────────────────────────
cd backend && npm test
```
