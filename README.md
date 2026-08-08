# Email Task Router — ALUMNX AI LABS FDE Intern Hiring Challenge

**candidate_id**: arijitkonar16@gmail.com

## Deployed URLs

- **Backend**: https://email-task-router.onrender.com
- **Frontend**: https://email-task-router-one.vercel.app
- **GitHub**: https://github.com/Samurai007AK/email-task-router

---

## What This Does

An AI-powered email-to-task routing system that:
1. **Ingests** messy business emails (HTML, reply chains, Hinglish, mixed languages)
2. **Classifies** them using an LLM (Gemma 4 31B on Ollama Cloud by default, Gemini fallback) into categories (RFP, marketing, finance, etc.)
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
# 1. Setup backend (clone + deps + env — add GEMINI_API_KEY and/or OLLAMA_API_KEY to .env)
git clone https://github.com/Samurai007AK/email-task-router && cd email-task-router/backend && pip install -r requirements.txt && cp .env.example .env

# 2. Run backend
uvicorn main:app --reload

# 3. Run frontend (separate terminal)
cd ../frontend && npm install && npm run dev
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
                              │   SQLite (WAL)  ││   - tasks       │
│   - emails      │
│   - threads     │
│   - chat_logs   │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │ Gemma 4 31B     │
                              │ (Ollama Cloud)  │
                              │ + Gemini fallb. │
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
GEMINI_API_KEY=your_gemini_api_key_here   # fallback provider (either key alone is enough)
GEMINI_MODEL=                             # optional; empty = automatic fallback chain
OLLAMA_API_KEY=your_ollama_api_key_here   # primary provider (recommended)
OLLAMA_MODEL=gemma4:31b                   # optional; empty = gemma4:31b
OLLAMA_BASE_URL=https://ollama.com/v1     # optional; OpenAI-compatible endpoint
CANDIDATE_ID=arijitkonar16@gmail.com
DATABASE_URL=sqlite+aiosqlite:///./data/tasks.db
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","https://email-task-router-one.vercel.app"]
```

> **LLM provider**: When `OLLAMA_API_KEY` is set, classification and chat phrasing run
> on **Gemma 4 31B via Ollama Cloud** (OpenAI-compatible endpoint, generous free tier).
> If Ollama is down or unconfigured, the backend falls back to the Gemini fallback chain
> (newer models first, 429 retries with the provider's suggested delay). Either key alone
> is enough to run; set `GEMINI_MODEL` or `OLLAMA_MODEL` to pin specific models.

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
│   ├── classification.py    # LLM classification engine (Ollama/Gemma + Gemini fallback)
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
├── EVALS.md                 # Evaluation results (60 emails)
├── DECISIONS.md             # Engineering tradeoffs
└── README.md                # This file
```

---

## Evaluation

See [EVALS.md](EVALS.md) for detailed evaluation results:
- 60 hand-labelled emails (requirement: ≥50)
- Per-category precision/recall/F1
- Failure case analysis
- Confidence calibration

## Engineering Decisions

See [DECISIONS.md](DECISIONS.md) for 5 key tradeoffs:
1. LLM provider strategy (Ollama/Gemma primary + Gemini fallback), rate limits and retries
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
- [x] EVALS.md with 60 hand-labelled emails (requirement: ≥50)
- [x] DECISIONS.md with 5 tradeoffs
- [x] Chat grounding approach documented

---

*ALUMNX AI LABS · FDE Intern Hiring Challenge · 8th August 2026*
