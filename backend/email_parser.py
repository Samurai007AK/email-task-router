import re
import html2text
from bs4 import BeautifulSoup
from typing import Optional, Dict, Any

def clean_html(raw_html: str) -> str:
    """Convert HTML email to clean text."""
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "html.parser")
    for tag in soup(["script", "style", "head"]):
        tag.decompose()
    for img in soup.find_all("img"):
        if img.get("width") == "1" or img.get("height") == "1":
            img.decompose()
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.body_width = 0
    text = h.handle(str(soup))
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

def strip_quoted_text(text: str) -> str:
    """Remove quoted reply text and forwarded content."""
    patterns = [
        r'On .+ wrote:',
        r'From: .+@.+\n',
        r'-{3,} Forwarded .+ -{3,}',
        r'_{3,}',
        r'>{2,}',
        r'From:.*Sent:.*To:.*Subject:.*',
        r'---------- Forwarded .* ----------',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            text = text[:match.start()]

    sig_patterns = [
        r'\n--\s*\n',
        r'\nBest regards',
        r'\nThanks,\s*\n',
        r'\nSent from my iPhone',
        r'\nRegards,?\s*\n',
    ]
    for pattern in sig_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            text = text[:match.start()]

    return text.strip()

def parse_indian_currency(text: str) -> list:
    """Extract Indian currency amounts from text."""
    results = []
    patterns = [
        (r'(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{2})?)', 1),
        (r'([\d.]+)\s*(?:lakhs?|lacs?|l)\b', 100_000),
        (r'([\d.]+)\s*(?:crores?|crs?|cr)\b', 10_000_000),
    ]
    for pattern, multiplier in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            raw = match.group(1).replace(',', '')
            try:
                amount = float(raw) * multiplier
                results.append({"raw": match.group(0), "amount": int(amount)})
            except ValueError:
                continue
    return results

def detect_ooo(text: str, subject: str = "") -> bool:
    """Detect out-of-office auto-replies."""
    ooo_patterns = [
        r'auto[- ]?reply', r'out of office', r'currently unavailable',
        r'will be back on', r'leave of absence', r'vacation responder',
        r'auto[- ]?generated', r'I am away', r'until \d{1,2}(?:st|nd|rd|th)?',
    ]
    combined = (subject + " " + text[:500]).lower()
    return any(re.search(p, combined) for p in ooo_patterns)

def detect_newsletter(text: str, from_email: str = "") -> bool:
    """Detect newsletters and marketing bulk emails."""
    newsletter_indicators = ['unsubscribe', 'view in browser', 'email preferences', 'marketing email']
    indicator_count = sum(1 for ind in newsletter_indicators if ind in text.lower())
    if indicator_count >= 2:
        return True
    newsletter_domains = ['newsletter', 'marketing', 'bulk', 'noreply', 'no-reply', 'mailer', 'campaign', 'sendgrid.net', 'mailchimp.com', 'substack.com']
    return any(d in from_email.lower() for d in newsletter_domains)

def detect_vendor_spam(text: str) -> bool:
    """Detect unsolicited vendor spam."""
    spam_indicators = [
        r'we(?:\'ve)? helped \d+', r'free audit', r'quick \d+ min call',
        r'page 1', r'organic traffic', r'ranking on', r'we do content marketing',
        r'interested in a quick', r'noticed your website',
    ]
    return sum(1 for p in spam_indicators if re.search(p, text, re.IGNORECASE)) >= 2
