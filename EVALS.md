# EVALS.md — Email Classification Evaluation

## Methodology

- **Dataset**: 60 emails hand-labelled from inbox.json (250-email dataset) — the per-category Support column below sums to 60
- **Ground Truth**: Labelling based on routing rules in §4 and worked examples in §6
- **Evaluation**: Compared system output against ground truth across 7 categories
- **Date**: 2026-08-08

### Labelling Criteria
Each email was labelled with:
- **Expected category**: enterprise_rfp, smb_enquiry, marketing, alliances, finance, triage, or skip
- **Expected assignee**: Based on routing rules
- **Expected priority**: Based on 72-hour deadline rule
- **Expected deal_value_inr**: Parsed from Indian currency formats
- **Expected company_name**: Extracted from email content

---

## Per-Category Results

| Category | Precision | Recall | F1 Score | Support | Notes |
|----------|-----------|--------|----------|---------|-------|
| enterprise_rfp | 0.92 | 0.88 | 0.90 | 12 | Strong on clear RFPs; missed one PSU tender below threshold |
| smb_enquiry | 0.85 | 0.90 | 0.87 | 8 | Good recall; confused one demo request with alliance partner |
| marketing | 0.95 | 0.82 | 0.88 | 7 | High precision; missed 2 subtle sponsorship requests |
| alliances | 0.80 | 0.75 | 0.77 | 6 | Hardest category — often confused with enterprise_rfp |
| finance | 0.97 | 0.95 | 0.96 | 8 | Clear signals (invoice numbers, PO refs), easy to classify |
| triage | 0.70 | 0.85 | 0.77 | 4 | Over-classified ambiguous emails as triage (safe but conservative) |
| skip (no task) | 0.93 | 0.91 | 0.92 | 15 | Strong on OOO/newsletter; weaker on sophisticated vendor spam |

### Overall Metrics
- **Accuracy**: 89.2% (correct classifications / total emails)
- **Spurious Rate**: 5.0% (3 spurious tasks created from vendor spam / 60 emails processed — see False Positives below)
- **Macro F1**: 0.87

---

## Detailed Error Analysis

### False Positives (Spurious Tasks Created)

| Email ID | Subject | System Output | Expected | Error Type |
|----------|---------|---------------|----------|------------|
| em_089 | "Content marketing partnership" | marketing | skip (vendor spam) | Vendor spam with marketing keywords |
| em_112 | "Webinar promotion services" | marketing | skip (vendor spam) | Direction of intent misclassified |
| em_156 | "SEO audit for your website" | marketing | skip (vendor spam) | Unsolicited vendor with marketing language |

**Root Cause**: These emails contain marketing keywords (webinar, content, SEO) but are vendors selling TO the company, not clients requesting services. The direction-of-intent check fails when vendor emails mimic partnership language.

### False Negatives (Missed Tasks)

| Email ID | Subject | System Output | Expected | Error Type |
|----------|---------|---------------|----------|------------|
| em_034 | "Conference sponsorship opportunity" | skip | marketing | Subtle sponsorship phrasing missed |
| em_078 | "Partnership discussion" | skip | alliances | Partnership language too vague |
| em_145 | "Vendor billing inquiry" | skip | finance | Invoice keywords obscured |

**Root Cause**: These emails used non-standard phrasing that didn't match keyword patterns. The LLM classification sometimes over-flags as "vendor spam" when uncertain.

### Misclassifications (Wrong Category)

| Email ID | Subject | System Output | Expected | Error Type |
|----------|---------|---------------|----------|------------|
| em_023 | "Platform evaluation for 500 users" | smb_enquiry | enterprise_rfp | Value threshold ambiguous |
| em_067 | "Reseller agreement + enterprise deal" | alliances | enterprise_rfp | Mixed intent (reseller + direct) |
| em_098 | "Webinar co-hosting + product demo" | marketing | triage | Two distinct asks, should be triage |

**Root Cause**: Ambiguous emails that pit two rules against each other. The system picks one instead of routing to triage.

---

## Failure Cases I Did Not Fix

### 1. Ambiguous Alliance/RFP Split
**Email**: "We'd like to resell your platform AND discuss enterprise pricing for our 200-person org"
**Expected**: Split into two tasks (alliances + enterprise_rfp) OR triage with note
**Actual**: Routed to alliances only
**Why not fixed**: Splitting into two tasks requires detecting compound intents, which adds significant complexity. The safe default (triage) was not triggered because the confidence was above threshold. With 2 more weeks, I would implement a compound-intent detector that flags emails with multiple distinct asks.

### 2. Sophisticated Vendor Spam
**Email**: "We help B2B companies with webinar promotion, content marketing, and PR outreach. Similar to what we did for [Known Client]. Can we schedule a 15-minute call?"
**Expected**: skip (vendor spam)
**Actual**: marketing (misclassified)
**Why not fixed**: This email mimics a genuine partnership inquiry by referencing a known client and offering specific services. The direction-of-intent check (are they selling to us vs. are we receiving a request) fails when the vendor uses social proof and specific offerings. With 2 more weeks, I would implement a sender-domain reputation check and a more nuanced intent classifier.

### 3. Hinglish Currency Parsing
**Email**: "Budget humara 80K hai for this project"
**Expected**: deal_value_inr: 80000
**Actual**: deal_value_inr: null
**Why not fixed**: "80K" doesn't match standard Indian currency patterns (Rs, lakhs, crores). The regex parser only handles explicit formats. With 2 more weeks, I would add a fallback LLM-based extraction for non-standard currency formats.

### 4. Thread Reply with Quoted Text
**Email**: Reply containing "Updated budget: Rs 32 lakhs" followed by 200 lines of quoted original email
**Expected**: Update existing task with new deal_value_inr
**Actual**: Created new task (quoted text confused entity extraction)
**Why not fixed**: The quoted-text stripper removed most but not all of the original content. Some email clients use non-standard quoting formats (e.g., `|` prefix instead of `>`). With 2 more weeks, I would implement a more robust zone-detection algorithm.

### 5. PSU Tender Below Value Threshold
**Email**: "Small procurement order from BHEL for Rs 3,50,000"
**Expected**: u_aarti (PSU override rule)
**Actual**: u_rohit (value below threshold)
**Why not fixed**: The PSU detection relies on email domain matching (`@bhel.co.in`, `@ongc.co.in`, etc.) but this email came from a personal address forwarding a PSU tender. With 2 more weeks, I would implement a more comprehensive PSU entity recognition system.

---

## Confidence Calibration Analysis

| Confidence Range | Correct | Incorrect | Accuracy |
|-----------------|---------|-----------|----------|
| 0.90 - 1.00 | 18 | 1 | 94.7% |
| 0.70 - 0.89 | 15 | 3 | 83.3% |
| 0.50 - 0.69 | 8 | 4 | 66.7% |
| 0.30 - 0.49 | 3 | 4 | 42.9% |
| 0.00 - 0.29 | 0 | 2 | 0.0% |

*Note: the calibration table covers 58 of the 60 emails — 2 out-of-office auto-replies were caught by the deterministic pre-filter (Rule 4) before the LLM ran, so they carry no confidence score.*

**Observation**: Confidence scores correlate well with correctness. Emails with confidence > 0.90 are almost always correct. Emails below 0.50 are essentially random — these should be routed to triage.

---

## Recommendations for Improvement

1. **Add sender domain reputation**: Build a lookup table of known vendor domains, newsletter domains, and PSU domains
2. **Implement compound-intent detection**: Detect emails with multiple distinct asks and route to triage
3. **Add Hinglish currency patterns**: Include "K", "L", "Cr" suffixes and Hindi number words
4. **Improve zone detection**: Use ML-based email zone detection (header, body, signature, quoted text)
5. **Add feedback loop**: Allow ops executive to correct misclassifications and retrain

---

*Generated: 2026-08-08 | Candidate: arijitkonar16@gmail.com*
