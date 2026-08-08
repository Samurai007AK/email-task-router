# ALUMNX AI Labs — FDE Intern Hiring Challenge

## Complete Journey & Documentation

---

## What Is This?

This is an **AI-powered email-to-task routing system** built for the ALUMNX AI Labs FDE Intern Hiring Challenge (Hackathon Round 2). It automatically:

1. **Ingests** raw B2B emails
2. **Classifies** them using Google Gemini 2.5 Flash LLM
3. **Routes** them to the right team member (Sales Enterprise, Sales SMB, Marketing, Alliances, Finance, or Triage)
4. **Creates tasks** in a SQLite database
5. **Provides a chat interface** to query those tasks in natural language

---

## The Problem Statement

ALUMNX AI Labs receives hundreds of B2B emails daily — RFPs, partnership proposals, webinar invitations, payment reminders, spam, out-of-office replies. Currently, humans manually read and route these. The challenge:

> **Build a system that ingests raw B2B emails, classifies and routes them to team members, creates tasks, and provides a conversational chat interface — all powered by an LLM.**

### Grading Criteria
| Weight | What |
|--------|------|
| 25% | Automated accuracy test (50+ labelled emails) |
| 15% | Idempotency & thread reconciliation |
| 15% | Evaluation harness & metrics |
| 10% | Engineering quality |
| 20% | Conversational chat interface |
| 15% | Communication & documentation |

### Key Requirements
- Must use **Gemini API** (not OpenAI) — confirmed in problem statement
- Must use **SQLite** with WAL mode
- Must have **candidate_id** isolation (`priya.sharma@gmail.com`)
- Must support **idempotent ingestion** (duplicate emails ignored)
- Must support **thread reconciliation** (email replies update existing tasks)
- Must have **dedup on source_email_id**
- Must expose **Task API**, **Ingest API**, **Chat API**, **Stats API**, **Users API**
- Must have **HEALTH endpoint**
- Frontend must have **Generate 250 Emails** button + **Dashboard** + **Chat**

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  FRONTEND                    │
│          React + Vite + Tailwind             │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Ingest   │  │Dashboard │  │   Chat   │  │
│  │   Tab     │  │   Tab    │  │   Tab    │  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  │
│        │              │              │        │
└────────┼──────────────┼──────────────┼────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────────────────────────────────────┐
│                  BACKEND                     │
│           FastAPI + Python 3.14              │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Ingest   │  │ Task API │  │   Chat   │  │
│  │ Endpoint │  │ Endpoints│  │ Endpoint │  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  │
│        │              │              │        │
│  ┌─────▼──────────────▼──────────────▼────┐  │
│  │         Classification Engine          │  │
│  │      Google Gemini 2.5 Flash LLM       │  │
│  └─────────────────┬──────────────────────┘  │
│                    │                          │
│  ┌─────────────────▼──────────────────────┐  │
│  │           SQLite (WAL mode)            │  │
│  │   Tasks │ Emails │ Threads │ Users     │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Team Members (Seeded Data)

| user_id | Name | Department | Scope |
|---------|------|------------|-------|
| u_aarti | Aarti Menon | Sales — Enterprise | RFPs, RFIs, tenders, deals > ₹10,00,000 |
| u_rohit | Rohit Sharma | Sales — SMB | Product enquiries, demo requests, deals ≤ ₹10,00,000 |
| u_meera | Meera Iyer | Marketing | Webinars, events, sponsorships, content, PR |
| u_karan | Karan Doshi | Alliances | Reseller, channel partner, tech integration |
| u_divya | Divya Rao | Finance | Invoices, POs, payment reminders, GST |
| u_triage | Triage Queue | Operations | Ambiguous items requiring human review |

---

## Classification Rules

### What Gets SKIPPED (No Task Created)
| Type | Detection |
|------|-----------|
| Out-of-Office | Keywords: "out of office", "auto-reply", "OOO", "will return" |
| Newsletter | Keywords: "unsubscribe", "view in browser", "newsletter", "weekly digest" |
| Vendor Spam | Phrases: "buy leads", "SEO ranking", "free audit", "reply STOP" |

### Routing Logic
| Email Type | Route To |
|------------|----------|
| RFP/RFI/Tender > ₹10L | u_aarti (Sales Enterprise) |
| Demo request / Product enquiry ≤ ₹10L | u_rohit (Sales SMB) |
| Webinar / Event sponsorship | u_meera (Marketing) |
| Channel partner / Reseller | u_karan (Alliances) |
| Invoice / Payment reminder | u_divya (Finance) |
| Ambiguous / Unclear | u_triage (Triage Queue) |

---

## API Endpoints

### 1. Health Check
```
GET /health
→ {"status": "healthy", "timestamp": "..."}
```

### 2. Users
```
GET /users
→ {"team": [...]} // 6 team members
```

### 3. Task API
```
GET /tasks?candidate_id=priya.sharma@gmail.com
→ [{"task_id": "tsk_abc123", "title": "...", ...}]
```

### 4. Ingest API
```
POST /ingest
Body: {
  "candidate_id": "priya.sharma@gmail.com",
  "emails": [
    {
      "email_id": "em_001",
      "thread_id": "th_001",
      "message_index": 0,
      "from_name": "...",
      "from_email": "...",
      "to": "...",
      "cc": [],
      "subject": "...",
      "body": "...",
      "received_at": "2026-08-01T09:00:00+05:30",
      "attachments": [],
      "is_reply": false
    }
  ]
}
→ {"processed": 10, "tasks_created": 5, "tasks_updated": 0, "skipped": 3, "errors": []}
```

### 5. Chat API
```
POST /api/chat
Body: {"query": "What tasks are pending?", "candidate_id": "priya.sharma@gmail.com"}
→ {"answer": "...", "supporting_data": [...]}
```

### 6. Stats API
```
GET /api/stats?candidate_id=priya.sharma@gmail.com
→ {"total_tasks": 10, "by_assignee": {...}, "by_priority": {...}, ...}
```

---

## File Structure

```
email-task-router/
├── backend/
│   ├── main.py              # FastAPI app, all routes
│   ├── config.py            # Settings (env vars, team members)
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── database.py          # SQLite async engine + WAL mode
│   ├── classification.py    # Gemini LLM classification engine
│   ├── email_parser.py      # HTML cleaning, OOO/newsletter/spam detection
│   ├── ingest.py            # Email batch processing + dedup + threading
│   ├── chat.py              # Conversational query interface
│   ├── stats.py             # Aggregate statistics
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app with tab navigation
│   │   ├── components/
│   │   │   ├── IngestTab.jsx    # 250 email generator + ingest UI
│   │   │   ├── DashboardTab.jsx # Task list + stats dashboard
│   │   │   └── ChatTab.jsx      # Conversational chat interface
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── EVALS.md                 # 50+ hand-labelled emails with expected outputs
├── DECISIONS.md             # 5 engineering tradeoff decisions
├── README.md                # Project documentation
└── JOURNEY.md               # This file
```

---

## The Journey

### Phase 1: Research (Completed)
- Analyzed 20+ GitHub repos and research papers
- Studied architecture patterns for email classification systems
- Identified best practices: few-shot prompting, heuristic pre-filters, thread reconciliation

### Phase 2: Backend Build (Completed)
1. **Database Layer**: SQLite with WAL mode, async SQLAlchemy
   - Models: TaskModel, EmailModel, ThreadModel, UserModel
   - candidate_id isolation on all queries
   
2. **Classification Engine**: Gemini 2.5 Flash
   - 11 few-shot examples in prompt
   - Heuristic pre-filter (OOO, newsletter, spam detection)
   - Rate limiting: 1 second between Gemini calls
   - Fallback classification if API fails
   
3. **Ingest Pipeline**:
   - Email dedup by email_id
   - Thread reconciliation (replies update existing tasks)
   - source_email_id dedup
   - HTML cleaning + quoted text stripping
   - Indian currency parsing (Rs., lakhs, crores → integer)
   
4. **Chat Interface**:
   - Structured query classification (list/count/summary/details)
   - Anti-hallucination: only uses DB data
   - Supporting data in response
   
5. **Task API**: Full CRUD with candidate_id isolation

### Phase 3: Frontend Build (Completed)
1. **Ingest Tab**: Generate 250 sample emails + submit for ingestion
2. **Dashboard Tab**: Task list + statistics
3. **Chat Tab**: Conversational interface with sample questions

### Phase 4: Documentation (Completed)
- README.md with full setup instructions
- EVALS.md with 50+ hand-labelled test emails
- DECISIONS.md with 5 engineering tradeoffs

### Phase 5: Deployment (In Progress)
- **Backend**: Render (Python 3.14, auto-deploy from GitHub)
- **Frontend**: Vercel (React/Vite, auto-deploy from GitHub)
- **Repository**: GitHub (public)

### Phase 6: Bug Fixes (In Progress)
1. ✅ Fixed: Pydantic JSONResponse for enum errors (flat JSON, not nested)
2. ✅ Fixed: GET /api/tasks endpoint added
3. ✅ Fixed: Email dedup in ingest
4. ✅ Fixed: candidate_id normalization
5. ✅ Fixed: Rate limiting (1 sec between Gemini calls)
6. ✅ Fixed: Thread queries scoped via join
7. ✅ Fixed: Indentation error in ingest.py
8. ✅ Fixed: Safe .get() access for classification results
9. ✅ Fixed: API key check with fallback
10. ⏳ Pending: Render redeployment verification

---

## Deployed URLs

| Service | URL |
|---------|-----|
| **Backend** | https://email-task-router.onrender.com |
| **Frontend** | https://email-task-router-one.vercel.app |
| **GitHub** | https://github.com/Samurai007AK/email-task-router |

---

## How to Test

### 1. Health Check
```
curl https://email-task-router.onrender.com/health
```

### 2. Users
```
curl https://email-task-router.onrender.com/users
```

### 3. Ingest Emails
```bash
curl -X POST https://email-task-router.onrender.com/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "priya.sharma@gmail.com",
    "emails": [
      {
        "email_id": "em_test_001",
        "thread_id": "th_test_001",
        "message_index": 0,
        "from_name": "Suresh Kulkarni",
        "from_email": "s.kulkarni@meridiansteel.co.in",
        "to": "sales@company.com",
        "cc": ["procurement@meridiansteel.co.in"],
        "subject": "RFP - Enterprise Document Management System",
        "body": "Dear Team, Meridian Steel invites proposals for an enterprise document management system covering 4 plants and ~1,200 users. Indicative budget is Rs. 25 lakhs.",
        "received_at": "2026-08-01T09:14:22+05:30",
        "attachments": ["RFP_DMS_2026.pdf"],
        "is_reply": false
      }
    ]
  }'
```

### 4. Check Tasks
```
curl "https://email-task-router.onrender.com/tasks?candidate_id=priya.sharma@gmail.com"
```

### 5. Chat Query
```bash
curl -X POST https://email-task-router.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What tasks are assigned to Aarti?", "candidate_id": "priya.sharma@gmail.com"}'
```

### 6. Stats
```
curl "https://email-task-router.onrender.com/api/stats?candidate_id=priya.sharma@gmail.com"
```

---

## Known Issues

1. **Render cold start**: Free tier takes 30-50 seconds to wake up
2. **Rate limiting**: Gemini API calls limited to 1/sec
3. **Python 3.14**: Render uses Python 3.14.3 (latest)
4. **Database**: SQLite file is ephemeral on Render (resets on redeploy)

---

## Next Steps

1. ✅ Verify Render deployment with fixed code
2. ✅ Run comprehensive test with 250 emails
3. ✅ Verify chat interface works
4. ✅ Verify frontend Generate button works
5. ✅ Submit URLs to hackathon form

---

## Lessons Learned

1. **Always use .get() for dict access** — bracket notation fails on missing keys
2. **Render free tier has quirks** — Python version, cold starts, ephemeral storage
3. **Rate limiting is critical** — Gemini API will reject rapid calls
4. **Heuristic pre-filters save money** — OOO/newsletter/spam detected before LLM call
5. **Thread reconciliation is complex** — need to track thread_id → task_id mapping
6. **candidate_id isolation is essential** — every query must filter by candidate_id
7. **Flat JSON for errors** — Pydantic's JSONResponse wraps in {"detail": ...} which breaks frontend

---

*Last updated: August 8, 2026*
*Built by: Priya Sharma (priya.sharma@gmail.com)*
