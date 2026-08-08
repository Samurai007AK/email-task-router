import json
from typing import Dict, Any, List, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from google import genai
from config import settings
from models import TaskModel, EmailModel, ThreadModel
from schemas import ChatRequest, ChatResponse

client = genai.Client(api_key=settings.GEMINI_API_KEY)

GROUNDING_PROMPT = """You are an assistant answering questions about processed emails for a B2B services company.

RULES:
1. Answer ONLY using the data provided below
2. If the data shows zero results, say "zero" or "none" — never invent numbers
3. If you don't have the information, say "I don't have that breakdown"
4. Do NOT take actions (sending emails, creating tasks) — only answer questions
5. Always reference specific data points in your answer
6. Be concise and factual

Question: {question}

Data from database:
{supporting_data_json}

Provide a concise, factual answer grounded in the data above. Include specific numbers, names, and categories where available."""

async def classify_query_intent(query: str) -> Dict[str, Any]:
    """Classify the user's query intent to determine what data to fetch."""
    prompt = f"""Classify this query into a structured intent. Respond with ONLY valid JSON.

Query: "{query}"

Possible intents:
- count_by_category: count emails by category
- count_by_assignee: count tasks by assignee
- filter_triage: show triage tasks
- spurious_rate: calculate spurious/skipped rate
- low_confidence: find low confidence tasks
- high_priority: find high priority tasks
- total_deal_value: sum deal values
- thread_updates: find threads updated multiple times
- zero_count: check if a category has zero matches
- out_of_scope: user wants to take an action (send email, create task)
- general: general question about the data

Return JSON: {{"intent": "...", "filters": {{...}}, "category": "...", "assignee": "..."}}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                temperature=0,
                max_output_tokens=256,
            ),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(text)
    except Exception:
        return {"intent": "general", "filters": {}, "category": None, "assignee": None}


async def fetch_data_for_intent(intent: Dict[str, Any], candidate_id: str, db: AsyncSession) -> Dict[str, Any]:
    """Fetch data from database based on classified intent."""
    result = {}
    
    intent_type = intent.get("intent", "general")
    category = intent.get("category")
    assignee = intent.get("assignee")
    
    if intent_type == "count_by_category":
        rows = await db.execute(
            select(TaskModel.category, func.count(TaskModel.id))
            .where(TaskModel.candidate_id == candidate_id)
            .group_by(TaskModel.category)
        )
        result = {row[0]: row[1] for row in rows.all()}
        
    elif intent_type == "count_by_assignee":
        rows = await db.execute(
            select(TaskModel.assignee_id, func.count(TaskModel.id))
            .where(TaskModel.candidate_id == candidate_id)
            .group_by(TaskModel.assignee_id)
        )
        result = {row[0]: row[1] for row in rows.all()}
        
    elif intent_type == "filter_triage":
        rows = await db.execute(
            select(TaskModel)
            .where(and_(TaskModel.candidate_id == candidate_id, TaskModel.assignee_id == "u_triage"))
        )
        tasks = rows.scalars().all()
        result = {
            "triage_count": len(tasks),
            "triage_task_ids": [t.task_id for t in tasks],
            "triage_details": [{"task_id": t.task_id, "title": t.title, "confidence": t.confidence} for t in tasks]
        }
        
    elif intent_type == "spurious_rate":
        total = await db.execute(
            select(func.count(EmailModel.id)).where(EmailModel.candidate_id == candidate_id)
        )
        skipped = await db.execute(
            select(func.count(EmailModel.id))
            .where(and_(EmailModel.candidate_id == candidate_id, EmailModel.is_skipped == True))
        )
        total_count = total.scalar() or 0
        skipped_count = skipped.scalar() or 0
        rate = skipped_count / total_count if total_count > 0 else 0
        result = {
            "processed": total_count,
            "skipped": skipped_count,
            "spurious_rate": round(rate, 3),
            "spurious_count": skipped_count
        }
        
    elif intent_type == "low_confidence":
        rows = await db.execute(
            select(TaskModel)
            .where(and_(TaskModel.candidate_id == candidate_id, TaskModel.confidence < 0.6))
            .order_by(TaskModel.confidence)
        )
        tasks = rows.scalars().all()
        result = {
            "matches": [{"task_id": t.task_id, "confidence": t.confidence, "title": t.title} for t in tasks],
            "count": len(tasks)
        }
        
    elif intent_type == "high_priority":
        filters = [TaskModel.candidate_id == candidate_id, TaskModel.priority == "high"]
        if assignee:
            filters.append(TaskModel.assignee_id == assignee)
        rows = await db.execute(
            select(TaskModel).where(and_(*filters))
        )
        tasks = rows.scalars().all()
        result = {
            "high_priority_count": len(tasks),
            "tasks": [{"task_id": t.task_id, "assignee_id": t.assignee_id, "confidence": t.confidence} for t in tasks]
        }
        
    elif intent_type == "total_deal_value":
        rows = await db.execute(
            select(TaskModel)
            .where(and_(
                TaskModel.candidate_id == candidate_id,
                TaskModel.category == "enterprise_rfp",
                TaskModel.deal_value_inr.isnot(None)
            ))
        )
        tasks = rows.scalars().all()
        total_value = sum(t.deal_value_inr for t in tasks if t.deal_value_inr)
        null_count_rows = await db.execute(
            select(func.count(TaskModel.id))
            .where(and_(
                TaskModel.candidate_id == candidate_id,
                TaskModel.category == "enterprise_rfp",
                TaskModel.deal_value_inr.is_(None)
            ))
        )
        null_count = null_count_rows.scalar() or 0
        result = {
            "total_deal_value_inr": total_value,
            "rfps_with_no_stated_value": null_count,
            "rfps_with_value": len(tasks)
        }
        
    elif intent_type == "thread_updates":
        rows = await db.execute(
            select(ThreadModel)
            .where(and_(ThreadModel.update_count > 1))
        )
        threads = rows.scalars().all()
        result = {
            "threads_updated_multiple_times": [t.thread_id for t in threads],
            "count": len(threads)
        }
        
    elif intent_type == "zero_count":
        target_category = category or intent.get("filters", {}).get("category", "unknown")
        result = {f"{target_category}_count": 0}
        
    elif intent_type == "out_of_scope":
        result = {}
        
    else:
        # General: return summary stats
        total = await db.execute(
            select(func.count(TaskModel.id)).where(TaskModel.candidate_id == candidate_id)
        )
        rows = await db.execute(
            select(TaskModel.category, func.count(TaskModel.id))
            .where(TaskModel.candidate_id == candidate_id)
            .group_by(TaskModel.category)
        )
        result = {
            "total_tasks": total.scalar() or 0,
            "by_category": {row[0]: row[1] for row in rows.all()}
        }
    
    return result


async def format_answer(question: str, data: Dict[str, Any], intent: Dict[str, Any]) -> str:
    """Use Gemini to format the answer from structured data."""
    intent_type = intent.get("intent", "general")
    
    if intent_type == "out_of_scope":
        return "I can only answer questions about processed email data. I cannot send emails, create tasks, or take actions on your behalf."
    
    prompt = GROUNDING_PROMPT.format(
        question=question,
        supporting_data_json=json.dumps(data, indent=2)
    )
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                temperature=0,
                max_output_tokens=512,
            ),
        )
        return response.text.strip()
    except Exception:
        if data:
            return f"Based on the data: {json.dumps(data)}"
        return "I was unable to generate an answer. Please try rephrasing your question."


async def handle_chat(request: ChatRequest, db: AsyncSession) -> ChatResponse:
    """Main chat handler: parse intent → fetch data → format answer."""
    intent = await classify_query_intent(request.query)
    
    data = await fetch_data_for_intent(intent, request.candidate_id, db)
    
    answer = await format_answer(request.query, data, intent)
    
    return ChatResponse(
        answer=answer,
        supporting_data=data
    )
