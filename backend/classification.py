import json
import os
import re
import asyncio
from typing import Optional, Dict, Any
import httpx
from google import genai
from config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Ollama Cloud (OpenAI-compatible chat completions). Tried BEFORE Gemini when
# OLLAMA_API_KEY is set. Model/URL are configurable via env.
OLLAMA_BASE_URL = (settings.OLLAMA_BASE_URL or "https://ollama.com/v1").rstrip("/")
OLLAMA_DEFAULT_MODEL = settings.OLLAMA_MODEL or "gemma4:31b"

# Which provider actually served each call — surfaced in /api/stats so the active
# provider is verifiable in production without reading logs.
PROVIDER_COUNTERS = {"ollama": 0, "gemini": 0, "error": 0}

# Model fallback chain: newer models first. 404 = model retired for this account,
# move to the next candidate. Set GEMINI_MODEL env var to pin a specific model
# (comma-separated values are tried in order).
GEMINI_MODEL_CANDIDATES = [
    "gemini-3-flash",
    "gemini-3-flash-preview",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
]


async def _call_ollama(prompt: str, max_output_tokens: int = 1024) -> str:
    """Call Ollama Cloud via its OpenAI-compatible endpoint. Bounded retries on 429/5xx."""
    headers = {
        "Authorization": f"Bearer {settings.OLLAMA_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": OLLAMA_DEFAULT_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0,
        "max_tokens": max_output_tokens,
    }
    last_error = None
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as http:
                resp = await http.post(f"{OLLAMA_BASE_URL}/chat/completions", headers=headers, json=payload)
            if resp.status_code == 429:
                retry_after = resp.headers.get("Retry-After")
                try:
                    delay = min(float(retry_after), 30.0) if retry_after else 30.0
                except (TypeError, ValueError):
                    delay = 30.0
                last_error = RuntimeError(f"HTTP 429 (rate-limited)")
                print(f"Ollama rate-limited, retry in {delay:.0f}s", flush=True)
                await asyncio.sleep(delay)
                continue
            if resp.status_code >= 500:
                last_error = RuntimeError(f"HTTP {resp.status_code}")
                print(f"Ollama server error {resp.status_code}, retrying", flush=True)
                await asyncio.sleep(3)
                continue
            if resp.status_code != 200:
                raise RuntimeError(f"Ollama HTTP {resp.status_code}: {resp.text[:200]}")
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return content.strip()
        except httpx.HTTPError as e:
            last_error = e
            print(f"Ollama transport error: {e}, retrying", flush=True)
            await asyncio.sleep(3)
        except Exception as e:
            last_error = e
            print(f"Ollama error: {e}", flush=True)
            raise
    raise RuntimeError(f"Ollama failed after retries. Last error: {last_error}")


async def generate_text(prompt: str, max_output_tokens: int = 1024) -> str:
    """Generate text. Tries Ollama Cloud first (if configured), then Gemini with
    model fallback + bounded 429 retries (respects RetryInfo delay)."""
    if settings.OLLAMA_API_KEY:
        try:
            text = await _call_ollama(prompt, max_output_tokens=max_output_tokens)
            PROVIDER_COUNTERS["ollama"] += 1
            print(f"LLM provider: ollama ({OLLAMA_DEFAULT_MODEL})", flush=True)
            return text
        except Exception as e:
            print(f"Ollama failed ({str(e)[:120]}), falling back to Gemini", flush=True)

    # ---- Gemini fallback chain ----
    candidates = [m.strip() for m in (settings.GEMINI_MODEL or "").split(",") if m.strip()] + GEMINI_MODEL_CANDIDATES
    last_error = None
    for model in candidates:
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        temperature=0,
                        max_output_tokens=max_output_tokens,
                    ),
                )
                PROVIDER_COUNTERS["gemini"] += 1
                print(f"LLM provider: gemini ({model})", flush=True)
                return response.text
            except Exception as e:
                last_error = e
                err = str(e)
                if "404" in err or "NOT_FOUND" in err or "no longer available" in err:
                    print(f"Gemini model '{model}' unavailable, trying next: {err[:120]}", flush=True)
                    break  # move to next candidate model
                if "429" in err or "RESOURCE_EXHAUSTED" in err or "quota" in err.lower():
                    match = re.search(r"retry in ([\d.]+)s", err)
                    delay = min(float(match.group(1)) if match else 30.0, 30.0)
                    print(f"Gemini rate-limited on '{model}', retry in {delay:.0f}s: {err[:120]}", flush=True)
                    await asyncio.sleep(delay)
                    continue
                print(f"Gemini error on '{model}': {err[:120]}", flush=True)
                break  # non-retryable, try next model
    PROVIDER_COUNTERS["error"] += 1
    raise RuntimeError(f"All Gemini models failed. Last error: {last_error}")

CLASSIFICATION_PROMPT = """You are an expert email classifier for a B2B services company in India.

## Routing Rules (apply in order)
1. RFPs, RFIs, tenders, inbound deals > ₹10,00,000 → assignee: u_aarti, category: enterprise_rfp
2. Product enquiries, demo requests, deals ≤ ₹10,00,000 → assignee: u_rohit, category: smb_enquiry
3. Webinars, event/conference sponsorships, content collaborations, PR → assignee: u_meera, category: marketing
4. Reseller, channel partner, technology integration proposals → assignee: u_karan, category: alliances
5. Invoices, POs, payment reminders, GST, vendor billing → assignee: u_divya, category: finance
6. Anything ambiguous → assignee: u_triage, category: triage

## Override Rules
- PSU/Government tenders ALWAYS → u_aarti (regardless of value)
- Out-of-office auto-replies, newsletters, unsolicited vendor spam → DO NOT CREATE TASK. Return skip=true.
- Reply on existing thread → should UPDATE existing task, not create new
- Deadline within 72 hours of received_at → priority: high

## Currency Parsing
- "Rs 25 lakhs" or "25 lakhs" = 2500000
- "1.2 cr" or "Rs 1.2 crore" = 12000000
- "Rs 1,18,000" = 118000
- Invoice amount ≠ deal value → deal_value_inr: null

## Important: Direction of Intent
- Emails SELLING TO US (vendor spam, cold outreach) → skip
- Emails FROM CLIENTS/PARTNERS (proposals, enquiries) → route
- Check: is the sender offering services, or requesting ours?

## Examples

Example 1 - Enterprise RFP:
From: s.kulkarni@meridiansteel.co.in
Subject: RFP - Enterprise Document Management System
Body: Meridian Steel invites proposals for an enterprise DMS. Indicative budget Rs 25 lakhs. Submission due 12th August 2026.
Result: {"assignee_id": "u_aarti", "category": "enterprise_rfp", "priority": "medium", "due_date": "2026-08-12", "deal_value_inr": 2500000, "company_name": "Meridian Steel", "confidence": 0.92}

Example 2 - SMB Demo:
From: ankit@railyardlogistics.in
Subject: Quick demo request
Body: Hi, we are a 30-person logistics startup. Can we get a demo next week? Nothing urgent.
Result: {"assignee_id": "u_rohit", "category": "smb_enquiry", "priority": "low", "due_date": null, "deal_value_inr": null, "company_name": "Railyard Logistics", "confidence": 0.90}

Example 3 - PSU Tender:
From: procurement@bhel.co.in
Subject: Tender Notice No. BHEL/PROC/2026/0847
Body: Bharat Heavy Electricals Limited invites bids for analytics software. Value Rs 6,50,000. Last date 03-08-2026.
Result: {"assignee_id": "u_aarti", "category": "enterprise_rfp", "priority": "high", "due_date": "2026-08-03", "deal_value_inr": 650000, "company_name": "Bharat Heavy Electricals Limited", "confidence": 0.95}

Example 4 - Marketing Sponsorship:
From: nandita@saassummit.in
Subject: Sponsorship confirmation needed
Body: India SaaS Summit Gold tier ₹4,00,000. Need confirmation by tomorrow EOD.
Result: {"assignee_id": "u_meera", "category": "marketing", "priority": "high", "due_date": "2026-08-03", "deal_value_inr": 400000, "company_name": "India SaaS Summit", "confidence": 0.93}

Example 5 - Out of Office (SKIP):
From: someone@company.com
Subject: Out of Office
Body: I am out of office until 14th August. For urgent matters contact colleague.
Result: {"skip": true, "reason": "out_of_office", "confidence": 0.98}

Example 6 - Newsletter (SKIP):
From: newsletter@techcrunch.com
Subject: The B2B Growth Weekly
Body: In this edition: why PLG is stalling, 5 pricing experiments. Unsubscribe.
Result: {"skip": true, "reason": "newsletter", "confidence": 0.97}

Example 7 - Vendor Spam (SKIP):
From: seo@webgrowth.io
Subject: Your website ranking
Body: We noticed your website is not ranking on page 1. We have helped 200+ companies. Free audit attached.
Result: {"skip": true, "reason": "vendor_spam", "confidence": 0.94}

Example 8 - Finance:
From: accounts@vantagecloud.in
Subject: Invoice INV-2026-0331
Body: Please find attached invoice for Rs 1,18,000 incl 18% GST against PO-88214. Now 12 days overdue.
Result: {"assignee_id": "u_divya", "category": "finance", "priority": "high", "due_date": null, "deal_value_inr": null, "company_name": "Vantage Cloud Services", "confidence": 0.95}

Example 9 - Alliances:
From: partner@zenithcloud.com
Subject: Partnership opportunity
Body: We are a Salesforce implementation partner with 40+ enterprise clients. We would like to explore reselling your platform.
Result: {"assignee_id": "u_karan", "category": "alliances", "priority": "medium", "due_date": null, "deal_value_inr": null, "company_name": "Zenith Cloud Partners", "confidence": 0.88}

Example 10 - Ambiguous (TRIAGE):
From: farhan@halcyonretail.com
Subject: Meeting follow-up
Body: Two things: (1) evaluate platform for 800-person org, budget TBD, (2) CMO wants to co-host a webinar.
Result: {"assignee_id": "u_triage", "category": "triage", "priority": "medium", "due_date": null, "deal_value_inr": null, "company_name": "Halcyon Retail", "confidence": 0.42}

Example 11 - Hinglish:
From: dealer@mahindra.in
Subject: Product inquiry
Body: Bhai, humko aapka product chahiye for dealer network. 150 users. Budget 1.2 cr. Board review 20th ko hai.
Result: {"assignee_id": "u_aarti", "category": "enterprise_rfp", "priority": "medium", "due_date": "2026-08-20", "deal_value_inr": 12000000, "company_name": null, "confidence": 0.87}

Now classify this email. Respond with ONLY valid JSON matching the schema above.

From: {from_name} <{from_email}>
To: {to}
Subject: {subject}
Date: {received_at}
Body:
{cleaned_body}"""

async def classify_email(email_data: dict) -> dict:
    """Classify an email using the configured LLM provider and return routing decision."""
    if not settings.GEMINI_API_KEY and not settings.OLLAMA_API_KEY:
        print("WARNING: no LLM key configured! Using fallback classification.", flush=True)
        return {
            "skip": False,
            "assignee_id": "u_triage",
            "category": "triage",
            "priority": "medium",
            "due_date": None,
            "deal_value_inr": None,
            "company_name": None,
            "confidence": 0.3,
            "error": "No LLM API key configured"
        }

    cleaned_body = email_data.get("cleaned_body", email_data.get("body", ""))

    # NOTE: use .replace(), NOT .format() — the prompt examples contain literal
    # JSON braces ({"assignee_id": ...}) which .format() would interpret as fields
    # and raise KeyError (e.g. '"assignee_id"')
    prompt = (
        CLASSIFICATION_PROMPT
        .replace("{from_name}", email_data.get("from_name", ""))
        .replace("{from_email}", email_data.get("from_email", ""))
        .replace("{to}", email_data.get("to", ""))
        .replace("{subject}", email_data.get("subject", ""))
        .replace("{received_at}", email_data.get("received_at", ""))
        .replace("{cleaned_body}", cleaned_body[:3000])
    )

    try:
        text = (await generate_text(prompt, max_output_tokens=1024)).strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        result = json.loads(text)

        if result.get("skip"):
            return {
                "skip": True,
                "reason": result.get("reason", "unknown"),
                "confidence": result.get("confidence", 0.5)
            }

        return {
            "skip": False,
            "assignee_id": result.get("assignee_id", "u_triage"),
            "category": result.get("category", "triage"),
            "priority": result.get("priority", "medium"),
            "due_date": result.get("due_date"),
            "deal_value_inr": result.get("deal_value_inr"),
            "company_name": result.get("company_name"),
            "confidence": result.get("confidence", 0.5)
        }
    except Exception as e:
        print(f"Classification error: {e}", flush=True)
        return {
            "skip": False,
            "assignee_id": "u_triage",
            "category": "triage",
            "priority": "medium",
            "due_date": None,
            "deal_value_inr": None,
            "company_name": None,
            "confidence": 0.3,
            "error": str(e)
        }
