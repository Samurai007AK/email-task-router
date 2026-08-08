import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import TaskModel, EmailModel, ThreadModel
from schemas import EmailInput, IngestResponse
from email_parser import clean_html, strip_quoted_text, parse_indian_currency, detect_ooo, detect_newsletter, detect_vendor_spam
from classification import classify_email
import uuid

def generate_task_id() -> str:
    return "tsk_" + uuid.uuid4().hex[:8]

async def process_emails(emails: List[EmailInput], candidate_id: str, db: AsyncSession) -> IngestResponse:
    tasks_created = 0
    tasks_updated = 0
    skipped = 0
    errors = []

    for idx, email in enumerate(emails):
        try:
            # Check for duplicate email_id
            existing_email = await db.execute(
                select(EmailModel).where(EmailModel.email_id == email.email_id)
            )
            if existing_email.scalar_one_or_none():
                continue

            cleaned = clean_html(email.body)
            stripped = strip_quoted_text(cleaned)

            is_ooo = detect_ooo(stripped, email.subject)
            is_newsletter = detect_newsletter(stripped, email.from_email)
            is_spam = detect_vendor_spam(stripped)

            if is_ooo or is_newsletter or is_spam:
                skip_reason = "out_of_office" if is_ooo else ("newsletter" if is_newsletter else "vendor_spam")
                email_record = EmailModel(
                    email_id=email.email_id,
                    thread_id=email.thread_id,
                    from_name=email.from_name,
                    from_email=email.from_email,
                    to_email=email.to,
                    cc_emails=json.dumps(email.cc),
                    subject=email.subject,
                    body=email.body,
                    received_at=email.received_at,
                    attachments=json.dumps(email.attachments),
                    is_reply=email.is_reply,
                    classification_result=json.dumps({"skip": True, "reason": skip_reason}),
                    is_skipped=True,
                    skip_reason=skip_reason,
                    candidate_id=candidate_id,
                    processed_at=datetime.utcnow().isoformat()
                )
                db.add(email_record)
                skipped += 1
                continue

            existing_thread = None
            if email.thread_id:
                result = await db.execute(
                    select(ThreadModel).where(ThreadModel.thread_id == email.thread_id)
                )
                existing_thread = result.scalar_one_or_none()

            classification = await classify_email({
                "from_name": email.from_name,
                "from_email": email.from_email,
                "to": email.to,
                "subject": email.subject,
                "received_at": email.received_at,
                "cleaned_body": stripped,
                "body": email.body
            })

            # Rate limit: 1 second between Gemini calls
            if idx < len(emails) - 1:
                await asyncio.sleep(1)

            if classification.get("skip"):
                email_record = EmailModel(
                    email_id=email.email_id,
                    thread_id=email.thread_id,
                    from_name=email.from_name,
                    from_email=email.from_email,
                    to_email=email.to,
                    cc_emails=json.dumps(email.cc),
                    subject=email.subject,
                    body=email.body,
                    received_at=email.received_at,
                    attachments=json.dumps(email.attachments),
                    is_reply=email.is_reply,
                    classification_result=json.dumps(classification),
                    is_skipped=True,
                    skip_reason=classification.get("reason", "unknown"),
                    candidate_id=candidate_id,
                    processed_at=datetime.utcnow().isoformat()
                )
                db.add(email_record)
                skipped += 1
                continue

            if existing_thread and existing_thread.task_id:
                result = await db.execute(
                    select(TaskModel).where(TaskModel.task_id == existing_thread.task_id)
                )
                existing_task = result.scalar_one_or_none()

                if existing_task:
                    if classification.get("priority"):
                        existing_task.priority = classification["priority"]
                    if classification.get("due_date"):
                        existing_task.due_date = classification["due_date"]
                    if classification.get("deal_value_inr") is not None:
                        existing_task.deal_value_inr = classification["deal_value_inr"]
                    if classification.get("confidence"):
                        existing_task.confidence = classification["confidence"]
                    existing_task.updated_at = datetime.utcnow().isoformat()

                    existing_thread.latest_email_id = email.email_id
                    existing_thread.update_count += 1
                    existing_thread.updated_at = datetime.utcnow().isoformat()

                    tasks_updated += 1
                else:
                    task_id = generate_task_id()
                    new_task = TaskModel(
                        task_id=task_id,
                        candidate_id=candidate_id,
                        source_email_id=email.email_id,
                        thread_id=email.thread_id,
                        title=f"{classification.get('category', 'unknown')} - {email.subject[:100]}",
                        description=stripped[:500],
                        assignee_id=classification.get("assignee_id", "u_triage"),
                        category=classification.get("category", "triage"),
                        priority=classification.get("priority", "medium"),
                        due_date=classification.get("due_date"),
                        deal_value_inr=classification.get("deal_value_inr"),
                        company_name=classification.get("company_name"),
                        confidence=classification.get("confidence", 0.5),
                        created_at=datetime.utcnow().isoformat()
                    )
                    db.add(new_task)
                    existing_thread.task_id = task_id
                    existing_thread.latest_email_id = email.email_id
                    existing_thread.update_count += 1
                    tasks_created += 1
            else:
                # Check for duplicate source_email_id before creating
                existing_task_check = await db.execute(
                    select(TaskModel).where(TaskModel.source_email_id == email.email_id)
                )
                if existing_task_check.scalar_one_or_none():
                    continue

                task_id = generate_task_id()
                new_task = TaskModel(
                    task_id=task_id,
                    candidate_id=candidate_id,
                    source_email_id=email.email_id,
                    thread_id=email.thread_id,
                    title=f"{classification.get('category', 'unknown')} - {email.subject[:100]}",
                    description=stripped[:500],
                    assignee_id=classification.get("assignee_id", "u_triage"),
                    category=classification.get("category", "triage"),
                    priority=classification.get("priority", "medium"),
                    due_date=classification.get("due_date"),
                    deal_value_inr=classification.get("deal_value_inr"),
                    company_name=classification.get("company_name"),
                    confidence=classification.get("confidence", 0.5),
                    created_at=datetime.utcnow().isoformat()
                )
                db.add(new_task)

                if email.thread_id:
                    thread = ThreadModel(
                        thread_id=email.thread_id,
                        candidate_id=candidate_id,
                        latest_email_id=email.email_id,
                        task_id=task_id,
                        update_count=1,
                        created_at=datetime.utcnow().isoformat()
                    )
                    db.add(thread)

                tasks_created += 1

            email_record = EmailModel(
                email_id=email.email_id,
                thread_id=email.thread_id,
                from_name=email.from_name,
                from_email=email.from_email,
                to_email=email.to,
                cc_emails=json.dumps(email.cc),
                subject=email.subject,
                body=email.body,
                received_at=email.received_at,
                attachments=json.dumps(email.attachments),
                is_reply=email.is_reply,
                classification_result=json.dumps(classification),
                is_skipped=False,
                skip_reason=None,
                candidate_id=candidate_id,
                processed_at=datetime.utcnow().isoformat()
            )
            db.add(email_record)

        except Exception as e:
            errors.append(f"Error processing {email.email_id}: {str(e)}")

    await db.commit()

    return IngestResponse(
        processed=len(emails),
        tasks_created=tasks_created,
        tasks_updated=tasks_updated,
        skipped=skipped,
        errors=errors
    )
