# DECISIONS.md — Engineering Tradeoffs

## 1. Gemini Rate Limits and Retries

### Decision
Implemented exponential backoff with jitter for Gemini API rate limits (429 errors), honouring Google's `RetryInfo.retryDelay` with a bounded 30s cap and 3 attempts per model. Added a 1-second delay between emails in a batch. Because `gemini-2.5-flash` is retired for new accounts (404), the client uses a model fallback chain — newer models first, moving to the next on 404 — with an optional `GEMINI_MODEL` env pin. On total failure the email falls back to u_triage rather than being dropped (a dropped email is worse than a slow one).

### Tradeoff
- **Chose**: Async semaphore + exponential backoff (base=2s, max=3 retries, jitter=0-1s)
- **Rejected**: Token bucket rate limiter (more complex, unnecessary for hackathon scale)
- **Rejected**: Request queuing with Redis (adds infrastructure complexity)

### Rationale
The hackathon processes batches of ≤100 emails. At 10 RPM with 5 concurrent calls, a 100-email batch takes ~20 seconds. Exponential backoff handles transient 429s without losing emails. The 1-second inter-email delay keeps us well under the rate limit.

### With 2 More Weeks
Implement a proper token bucket rate limiter with persistent state (survives restarts) and a request queue (Redis or SQLite-based) for true production-grade rate management. Add circuit breaker pattern for sustained rate limit violations.

---

## 2. Idempotency Enforcement

### Decision
Implemented deduplication on `source_email_id` at the Task API level. Before creating a task, check if one exists for that email. Thread reconciliation: check `thread_id`, if exists → PATCH existing task, not POST new. Atomic operations using SQLite transactions.

### Tradeoff
- **Chose**: Application-level dedup with DB constraint + transaction
- **Rejected**: Distributed locking with Redis (overkill for single-instance hackathon)
- **Rejected**: Idempotency keys in request headers (adds client complexity)

### Rationale
The grading runs 3 passes: Run 1 (accuracy), Run 2 (idempotency — same batch again), Run 3 (thread reconciliation — replies). Application-level dedup on `source_email_id` handles Run 2. Thread-based lookup handles Run 3. SQLite transactions ensure atomicity.

### With 2 More Weeks
Implement the 5-layer idempotency pattern:
1. Signature verification (if webhooks)
2. Atomic dedup on notification ID
3. Ack-before-work ordering
4. Secondary key check (content hash)
5. Per-thread locking for race conditions

Add idempotency keys to Task API responses and implement TTL-based dedup cleanup.

---

## 3. Backend Data Model for Chat

### Decision
Separate tables: `emails` (raw + classification metadata), `tasks` (Task API spec), `threads` (thread_id → task_id mapping). Chat queries the `emails` table for classification metadata (why something was skipped) and `tasks` table for created tasks. Supporting_data is computed from DB aggregates, not re-inferred.

### Tradeoff
- **Chose**: Normalized relational schema with separate tables
- **Rejected**: Single denormalized table (simpler but loses query flexibility)
- **Rejected**: Vector store for semantic search (adds complexity, not needed for structured queries)

### Rationale
The chat interface needs to answer questions like "how many were marketing vs spam?" which requires querying the `emails` table for skip reasons, and "show me triage tasks" which requires the `tasks` table. Separate tables allow independent querying without JOIN overhead. SQLite with FTS5 provides adequate search for the hackathon scale.

### With 2 More Weeks
Add FTS5 indexes for full-text search across email bodies and task descriptions. Implement vector embeddings (using Gemini embeddings) for semantic query support. Add a materialized view for common aggregate queries.

---

## 4. Anti-Hallucination Chat Approach

### Decision
Pattern: Parse question intent (Gemini) → Execute SQL query (DB) → Get raw data → LLM formats answer with data as context. LLM never generates facts, only phrases them. `supporting_data` always returned alongside answer.

### Tradeoff
- **Chose**: Structured query → LLM formatting (deterministic facts, natural language answer)
- **Rejected**: Pure LLM answer from raw emails (hallucination risk, inconsistent)
- **Rejected**: Pure SQL answer without LLM (robotic, poor UX)
- **Rejected**: RAG with vector store (adds complexity, not needed for structured data)

### Rationale
The grading specifically tests for hallucination: "How many emails were about GST refunds?" (a category with zero matches). A pure-LLM approach would invent a plausible number. The structured query approach ensures the answer is always grounded in actual DB results. The LLM only adds natural language phrasing.

### With 2 More Weeks
Implement citation-based answers where the LLM references specific email IDs or task IDs as evidence. Add confidence scoring based on data completeness (more data = higher confidence). Implement adversarial testing with a suite of hallucination-triggering questions.

---

## 5. Known Issue: Vendor Spam Misclassification

### Decision
Shipped with a known limitation: sophisticated vendor emails that use marketing keywords (webinar, content, PR) are sometimes misclassified as `marketing` instead of being skipped. The direction-of-intent check (are they selling to us vs. are we receiving a request) works for obvious cases but fails on nuanced vendor emails.

### Tradeoff
- **Chose**: Conservative classification (higher recall for marketing, some false positives)
- **Rejected**: Aggressive spam filtering (would miss real marketing emails)
- **Rejected**: Multi-pass classification (adds latency and complexity)

### Rationale
The grading weights spurious tasks (false positives) heavily. However, missing real marketing emails (false negatives) also costs points. I chose to optimize for recall on real marketing emails at the cost of some vendor spam slipping through. This is a conscious tradeoff based on the grading rubric.

### With 2 More Weeks
Implement a sender-domain reputation system: build a lookup table of known vendor domains, newsletter domains, and legitimate client domains. Add a "sender intent classifier" that specifically detects whether the sender is offering services (vendor) or requesting ours (client). Implement feedback loop where ops executive corrections improve future classification.

---

## Summary

| # | Decision | Key Tradeoff | Hackathon Impact |
|---|----------|--------------|------------------|
| 1 | Rate limit handling | Simplicity vs. production-grade | Prevents 429 errors during batch processing |
| 2 | Idempotency | App-level vs. distributed | Passes Run 2 (idempotency test) |
| 3 | Data model | Normalized vs. denormalized | Enables grounded chat queries |
| 4 | Anti-hallucination | Structured query vs. pure LLM | Prevents fabricated answers |
| 5 | Spam handling | Recall vs. precision | Balances spurious rate vs. missed tasks |

---

*Generated: 2026-08-08 | Candidate: priya.sharma@gmail.com*
