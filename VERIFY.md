# VERIFY.md — Pre-Submission Checklist

Run this checklist immediately before submitting. It takes ~5 minutes and covers every
graded surface: backend routes, the Task API spec (§5), chat traps (§8.3), and repo hygiene.

---

## 0. The exact values to submit (byte-identical everywhere)

| Field | Value |
|---|---|
| **candidate_id** | `arijitkonar16@gmail.com` |
| **Backend URL** | `https://email-task-router.onrender.com` |
| **Frontend URL** | `https://email-task-router-one.vercel.app` |
| **GitHub repo** | `https://github.com/Samurai007AK/email-task-router` |

These four strings must match your submission form, README.md, and every API call exactly.
A single-character difference in candidate_id = grader finds zero tasks = score zero.

---

## 1. Freeze Render (do this FIRST, before any testing)

- [ ] **Do NOT redeploy** the Render backend after this checklist starts.
- [ ] Do NOT change env vars on Render after this point (saving an env var triggers a redeploy).
- [ ] Do NOT push to `main` after this point — pushing triggers auto-deploy on Render AND Vercel.
      (Docs-only pushes are safe for Vercel but still redeploy Render — don't.)
- [ ] Reason: every Render redeploy wipes the SQLite DB. The grader's Run 1 → Run 2 → Run 3
      happen as separate requests minutes apart and **depend on Run 1's data surviving**.

> ✅ **Verified state (2026-08-08):** 0 tasks in DB, Gemma 4 31B (Ollama) active,
> `llm_provider: {'ollama': 6, 'gemini': 0, 'error': 0}`.

---

## 2. Warm-up ping (kill the cold-start risk)

Free-tier Render spins down after ~15 min idle. The grader's `GET /tasks` has a 60-second
timeout; a cold start takes ~30–50s. Warm it up right before you submit:

```bash
curl -s https://email-task-router.onrender.com/health
```

- [ ] Expect: `{"status":"healthy",...}` — repeat every few minutes if you're waiting.
- [ ] Keep the frontend open in a browser tab too (pings the same backend on load).

---

## 3. Backend quick checks (all endpoints, one base URL)

```bash
# Health
curl -s https://email-task-router.onrender.com/health
# → {"status":"healthy",...}

# Team roster (§5.6)
curl -s https://email-task-router.onrender.com/users
# → {"team":[{6 members: u_aarti, u_rohit, u_meera, u_karan, u_divya, u_triage}]}

# Raw Task API — must be empty (clean slate for Run 1)
curl -s "https://email-task-router.onrender.com/tasks?candidate_id=arijitkonar16@gmail.com"
# → []

# Enriched wrapper (frontend route) — also empty
curl -s "https://email-task-router.onrender.com/api/tasks?candidate_id=arijitkonar16@gmail.com"
# → []

# Stats incl. provider telemetry
curl -s "https://email-task-router.onrender.com/api/stats?candidate_id=arijitkonar16@gmail.com"
# → llm_provider: {"ollama": N>0, "gemini": 0, "error": 0}
```

- [ ] All 6 respond with HTTP 200 under the ONE backend URL.
- [ ] `tasks` returns `[]` (empty) — confirms the grader starts clean.

---

## 4. Enum validation — the exact 400 shape (§5.1)

```bash
curl -s -X POST https://email-task-router.onrender.com/tasks \
  -H 'Content-Type: application/json' \
  -d '{"candidate_id":"arijitkonar16@gmail.com","source_email_id":"em_z","thread_id":"th_z","title":"x","assignee_id":"Aarti","category":"enterprise_rfp","priority":"medium","confidence":0.5}'
```

- [ ] Expect HTTP **400** with EXACTLY:
```json
{"error":"invalid_enum_value","field":"assignee_id","received":"Aarti","allowed":["u_aarti","u_rohit","u_meera","u_karan","u_divya","u_triage"]}
```
- [ ] After this call, `GET /tasks` must STILL return `[]` (rejected, not stored).

---

## 5. Chat traps (§8.3) — the two that fail most submissions

```bash
# TRAP 1: zero-count category — must say "zero", never invent a number
curl -s -X POST https://email-task-router.onrender.com/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"candidate_id":"arijitkonar16@gmail.com","query":"How many emails were about GST refunds?"}'
# → {"answer":"zero","supporting_data":{}}

# TRAP 2: out-of-scope action — must decline, not pretend to comply
curl -s -X POST https://email-task-router.onrender.com/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"candidate_id":"arijitkonar16@gmail.com","query":"Send Aarti an email about the Meridian Steel RFP."}'
# → declines: "I can only answer questions about processed email data..."
```

- [ ] Both behave as above.
- [ ] NOTE: each chat call consumes one Ollama call (harmless, still `ollama` counter).

---

## 6. Frontend (manual, 2 minutes)

- [ ] Open https://email-task-router-one.vercel.app — loads with animated background.
- [ ] **Ingest tab**: paste a small JSON batch → renders as a **raw table BEFORE routing**.
- [ ] Click **Generate 250 sample emails** → table fills with 250 rows.
- [ ] Submit → runs through /ingest (a 250-email batch on Gemma takes a few minutes).
- [ ] **Dashboard tab**: counts + task list populate from live backend (no mocks).
- [ ] **Chat tab**: ask a question → answer + grounded numbers.

---

## 7. Repo hygiene (do this BEFORE freezing, not after)

- [ ] `git status --short` → clean (nothing uncommitted).
- [ ] `.env.example` present at `backend/.env.example`, contains NO real keys.
- [ ] No `.env` tracked: `git ls-files | grep '\.env$'` → nothing.
- [ ] No secrets in code: `git grep -iE 'AIza|sk-[A-Za-z0-9]{20,}'` → nothing.
- [ ] README.md, EVALS.md, DECISIONS.md present and internally consistent.
- [ ] README top shows candidate_id + all 3 URLs, byte-identical to §0 above.

---

## 8. Submit

Copy the four values from §0 into the submission form — no typos, no extra spaces,
no `+alias`, all lowercase. Use the real inbox you check (arijitkonar16@gmail.com).

---

## One-line summary of the rules

**Ping health → don't touch Render → submit the exact 4 strings.**
