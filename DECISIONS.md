# DECISIONS.md — Engineering Tradeoffs

## 1. LLM Provider Strategy, Rate Limits and Retries

### Decision
The primary provider for classification and chat phrasing is **Ollama Cloud (Gemma 4 31B, `gemma4:31b`)** whenever `OLLAMA_API_KEY` is set — it scored 8/8 on the spec's worked examples in local testing and does not suffer the free-tier quota churn that made Gemini unusable for batch work. **Gemini is the automatic fallback** if Ollama fails. Both paths share the same bounded-retry design:
- **Ollama**: 3 attempts per call; HTTP 429 honours `Retry-After` capped at 30s; 5xx/transport errors retry after 3s.
- **Gemini**: model fallback chain (`gemini-3-flash` → `gemini-3-flash-preview` → `gemini-2.5-flash-lite` → `gemini-2.0-flash` → `gemini-2.5-flash`) because newer models are retired for new accounts (404); 3 attempts per model; 429 delays honour `RetryInfo.retryDelay` capped at 30s. An optional `GEMINI_MODEL` env pin overrides the chain.
- Emails in a batch are processed **sequentially with a 1-second inter-email delay** (no concurrent fan-out).
- On total failure the email falls back to u_triage rather than being dropped (a dropped email is worse than a slow one).
- Which provider actually served each call is instrumented (`llm_provider` counters surfaced in `/api/stats`), so the active provider is verifiable in production without reading logs.

### Tradeoff
- **Chose**: Ollama Cloud primary + Gemini fallback, bounded retries (3 attempts, server-honoured delays capped at 30s), sequential processing with 1s spacing
- **Rejected**: Token bucket rate limiter (more complex, unnecessary for hackathon scale)
- **Rejected**: Request queuing with Redis (adds infrastructure complexity)
- **Rejected**: Concurrent Gemini fan-out (free-tier 429s made concurrency counterproductive; sequential + Ollama is both simpler and faster)

### Rationale
Batches are capped at 100 emails and /ingest has a 15-minute timeout. On Ollama, calls return in seconds, so a full 100-email batch takes roughly 2-4 minutes (dominated by the 1s inter-email delay) — comfortably inside the timeout. Gemini is deliberately the safety net, not the main path: at ~10 RPM, a full batch served by Gemini alone would take ≥10 minutes sequential, so relying on it would be a latency risk.

### With 2 More Weeks
Implement a proper token bucket rate limiter with persistent state (survives restarts) and a request queue (Redis or SQLite-based) for true production-grade rate management. Add a circuit breaker pattern for sustained rate-limit violations, and introduce a bounded concurrent worker pool now that Ollama removes the 429 constraint.

---

## 2. Idempotency Enforcement

### Decision
Implemented deduplication on `source_email_id` at the Task API level. Before creating a task, check if one exists for that email. Thread reconciliation: check `thread_id`, if exists → PATCH existing task, not POST new. Atomic operations using SQLite transactions.

### Tradeoff
- **Chose**: Application-level dedup (on `source_email_id` before create, on `thread_id` for updates) + unique DB constraints on `email_id` and `task_id` + SQLite transaction
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
Separate tables: `emails` (raw + classification metadata + skip reason), `tasks` (Task API spec), `threads` (thread_id → task_id mapping with `update_count` for reply tracking), and `chat_logs` (query/answer history). Chat queries `emails` for classification metadata (why something was skipped) and `tasks` for created tasks. `supporting_data` is computed from DB aggregates, never re-inferred.

### Tradeoff
- **Chose**: Normalized relational schema with separate tables
- **Rejected**: Single denormalized table (simpler but loses query flexibility)
- **Rejected**: Vector store for semantic search (adds complexity, not needed for structured queries)

### Rationale
The chat interface needs to answer questions like "how many were marketing vs spam?" which requires querying the `emails` table for skip reasons, and "show me triage tasks" which requires the `tasks` table. Separate tables allow independent querying without JOIN overhead. SQLite relational queries over indexed columns (`candidate_id`, `thread_id`, `category`) are more than adequate for the structured counts and filters chat needs — FTS5 would add nothing here.

### With 2 More Weeks
Add FTS5 indexes for full-text search across email bodies and task descriptions. Implement vector embeddings (using Gemini embeddings) for semantic query support. Add a materialized view for common aggregate queries.

---

## 4. Anti-Hallucination Chat Approach

### Decision
Pattern: Parse question intent (LLM — same Ollama-first/`generate_text` path, with a deterministic keyword fallback `_keyword_intent` if the LLM returns an unknown or unparseable intent) → Execute SQL query (DB) → Get raw data → LLM formats the answer with the data as context. The LLM never generates facts, only phrases them. An explicit `zero_count` intent exists so "GST refunds?"-style questions return a literal zero rather than a plausible guess. `supporting_data` is always returned alongside the answer so every number is traceable to a query result.

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
| 1 | LLM provider + rate limits | Ollama primary vs. Gemini fallback | Avoids free-tier 429 stalls during batch processing |
| 2 | Idempotency | App-level vs. distributed | Passes Run 2 (idempotency test) |
| 3 | Data model | Normalized vs. denormalized | Enables grounded chat queries |
| 4 | Anti-hallucination | Structured query vs. pure LLM | Prevents fabricated answers |
| 5 | Spam handling | Recall vs. precision | Balances spurious rate vs. missed tasks |

---

*Generated: 2026-08-08 | Candidate: arijitkonar16@gmail.com*
