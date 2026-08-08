# Email Task Router — ALUMNX AI LABS FDE Intern Hiring Challenge

**candidate_id**: priya.sharma@gmail.com

## Deployed URLs

- **Backend**: https://email-task-router.onrender.com
- **Frontend**: https://email-task-router-one.vercel.app
- **GitHub**: https://github.com/Samurai007AK/email-task-router

---

## What This Does

An AI-powered email-to-task routing system that:
1. **Ingests** messy business emails (HTML, reply chains, Hinglish, mixed languages)
2. **Classifies** them using Gemini LLM into categories (RFP, marketing, finance, etc.)
3. **Routes** tasks to the right team member based on business rules
4. **Provides** a conversational interface for ops teams to query processed data

### Key Features
- **Heuristic pre-filter**: Detects OOO, newsletters, and spam before hitting the LLM (saves API calls)
- **Thread reconciliation**: Reply emails update existing tasks, not create duplicates
- **Indian currency parsing**: Handles "Rs 25 lakhs", "1.2 cr", "₹4,00,000" formats
- **Grounded chat**: Answers questions from DB data, never hallucinates numbers
- **Idempotent processing**: Same batch twice = same result (no duplicate tasks)

---

## Quick Start (3 commands)

```bash
# 1. Clone and setup backend
cd email-task-router/backend
pip install -r requirements.txt
cp .env.example .env  # Add your GEMINI_API_KEY

# 2. Run backend
uvicorn main:app --reload

# 3. Run frontend (separate terminal)
cd ../frontend
npm install
npm run dev
```

Backend runs at http://localhost:8000
Frontend runs at http://localhost:5173

---

## Architecture

```
┌─────────────────┐         ┌─────────────────────────┐
│   React + Vite  │◄───────►│   FastAPI Backend       │
│   (Vercel)      │  CORS   │   (Render)              │
│                 │         │                         │
│  - JSON Input   │         │  POST /ingest           │
│  - Data Table   │         │  POST /tasks            │
│  - Chat Panel   │         │  GET  /tasks            │
│                 │         │  PATCH /tasks/{id}      │
│                 │         │  GET  /users            │
│                 │         │  POST /api/chat         │
│                 │         │  GET  /api/stats        │
└─────────────────┘         └──────────┬──────────────┘
                                       │
                              ┌────────▼────────┐
                              │   SQLite (WAL)  │
                              │   - tasks       │
                              │   - emails      │
                              │   - threads     │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  Gemini 2.5     │
                              │  Flash API      │
                              └─────────────────┘
```

---

## API Reference

### Task API (§5 spec)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /tasks | Create a task |
| PATCH | /tasks/{task_id} | Update a task |
| GET | /tasks?candidate_id={email} | List tasks |
| DELETE | /tasks/{task_id} | Delete a task |
| GET | /users | Team roster |

### Backend Endpoints (§7 spec)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /ingest | Process email batch (up to 100) |
| POST | /api/chat | Ask questions about processed data |
| GET | /api/stats | Aggregate statistics |
| GET | /health | Health check |

---

## Classification Categories

| Category | Assignee | Gets |
|----------|----------|------|
| enterprise_rfp | u_aarti | RFPs, RFIs, tenders, deals > ₹10L |
| smb_enquiry | u_rohit | Product enquiries, demos, deals ≤ ₹10L |
| marketing | u_meera | Webinars, sponsorships, content, PR |
| alliances | u_karan | Reseller, channel partner, tech integration |
| finance | u_divya | Invoices, POs, payment reminders, GST |
| triage | u_triage | Ambiguous items requiring human review |

### Override Rules
- PSU/Government tenders → always u_aarti (regardless of value)
- Out-of-office, newsletters, spam → NO TASK (skip)
- Reply on existing thread → UPDATE, not new task
- Deadline within 72 hours → priority: high

---

## Environment Variables

```bash
# .env (template in backend/.env.example)
GEMINI_API_KEY=your_gemini_api_key_here   # required
GEMINI_MODEL=                             # optional; empty = automatic fallback chain
CANDIDATE_ID=priya.sharma@gmail.com
DATABASE_URL=sqlite+aiosqlite:///./data/tasks.db
CORS_ORIGINS=["https://email-task-router-one.vercel.app"]
```

> **Model note**: `gemini-2.5-flash` is retired for new accounts. The backend tries a
> fallback chain (newer models first) and retries on 429 with Google's suggested delay.
> Set `GEMINI_MODEL` to pin one, e.g. `GEMINI_MODEL=gemini-3-flash`.

---

## Project Structure

```
email-task-router/
├── backend/
│   ├── main.py              # FastAPI app with all routes
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # DB engine and session
│   ├── config.py            # Settings from env
│   ├── classification.py    # Gemini classification engine
│   ├── email_parser.py      # HTML cleaning, currency parsing
│   ├── ingest.py            # Batch processing pipeline
│   ├── chat.py              # Conversational interface backend
│   ├── stats.py             # Aggregate statistics
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app with tabs
│   │   ├── components/
│   │   │   ├── IngestTab.jsx    # JSON input + data table
│   │   │   ├── DashboardTab.jsx # Task overview
│   │   │   └── ChatTab.jsx      # Conversational interface
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── EVALS.md                 # Evaluation results (50+ emails)
├── DECISIONS.md             # Engineering tradeoffs
└── README.md                # This file
```

---

## Evaluation

See [EVALS.md](EVALS.md) for detailed evaluation results:
- 50+ hand-labelled emails
- Per-category precision/recall/F1
- Failure case analysis
- Confidence calibration

## Engineering Decisions

See [DECISIONS.md](DECISIONS.md) for 5 key tradeoffs:
1. Gemini rate limits and retries
2. Idempotency enforcement
3. Backend data model for chat
4. Anti-hallucination approach
5. Known issue: vendor spam

---

## Grading Checklist

- [x] Deployed backend URL (includes Task API)
- [x] Deployed frontend URL
- [x] Public GitHub repo
- [x] Setup in ≤3 commands
- [x] .env.example included
- [x] No secrets committed
- [x] candidate_id at top of README
- [x] Deployed URLs at top of README
- [x] EVALS.md with 50+ hand-labelled emails
- [x] DECISIONS.md with 5 tradeoffs
- [x] Chat grounding approach documented

---

*ALUMNX AI LABS · FDE Intern Hiring Challenge · 8th August 2026*
