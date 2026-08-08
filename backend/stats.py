from typing import Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from models import TaskModel, EmailModel, ThreadModel
from classification import PROVIDER_COUNTERS

async def get_stats(candidate_id: str, db: AsyncSession) -> Dict[str, Any]:
    total_tasks_result = await db.execute(
        select(func.count(TaskModel.id)).where(TaskModel.candidate_id == candidate_id)
    )
    total = total_tasks_result.scalar() or 0

    cat_rows = await db.execute(
        select(TaskModel.category, func.count(TaskModel.id))
        .where(TaskModel.candidate_id == candidate_id)
        .group_by(TaskModel.category)
    )
    by_category = {row[0]: row[1] for row in cat_rows.all()}

    assignee_rows = await db.execute(
        select(TaskModel.assignee_id, func.count(TaskModel.id))
        .where(TaskModel.candidate_id == candidate_id)
        .group_by(TaskModel.assignee_id)
    )
    by_assignee = {row[0]: row[1] for row in assignee_rows.all()}

    priority_rows = await db.execute(
        select(TaskModel.priority, func.count(TaskModel.id))
        .where(TaskModel.candidate_id == candidate_id)
        .group_by(TaskModel.priority)
    )
    by_priority = {row[0]: row[1] for row in priority_rows.all()}

    total_emails_result = await db.execute(
        select(func.count(EmailModel.id)).where(EmailModel.candidate_id == candidate_id)
    )
    total_processed = total_emails_result.scalar() or 0

    skipped_result = await db.execute(
        select(func.count(EmailModel.id))
        .where(and_(EmailModel.candidate_id == candidate_id, EmailModel.is_skipped == True))
    )
    skipped = skipped_result.scalar() or 0

    skip_rows = await db.execute(
        select(EmailModel.skip_reason, func.count(EmailModel.id))
        .where(and_(EmailModel.candidate_id == candidate_id, EmailModel.is_skipped == True))
        .group_by(EmailModel.skip_reason)
    )
    skip_reasons = {row[0] or "unknown": row[1] for row in skip_rows.all()}

    # Thread stats scoped to candidate via TaskModel join
    thread_rows = await db.execute(
        select(func.count(ThreadModel.id))
        .join(TaskModel, ThreadModel.task_id == TaskModel.task_id)
        .where(TaskModel.candidate_id == candidate_id)
    )
    total_thread_count = thread_rows.scalar() or 0

    updated_thread_rows = await db.execute(
        select(func.count(ThreadModel.id))
        .join(TaskModel, ThreadModel.task_id == TaskModel.task_id)
        .where(and_(
            TaskModel.candidate_id == candidate_id,
            ThreadModel.update_count > 1
        ))
    )
    updated_thread_count = updated_thread_rows.scalar() or 0

    avg_conf_result = await db.execute(
        select(func.avg(TaskModel.confidence))
        .where(TaskModel.candidate_id == candidate_id)
    )
    avg_conf = avg_conf_result.scalar() or 0

    low_conf_result = await db.execute(
        select(func.count(TaskModel.id))
        .where(and_(TaskModel.candidate_id == candidate_id, TaskModel.confidence < 0.6))
    )
    low_conf = low_conf_result.scalar() or 0

    total_deal_result = await db.execute(
        select(func.sum(TaskModel.deal_value_inr))
        .where(and_(
            TaskModel.candidate_id == candidate_id,
            TaskModel.deal_value_inr.isnot(None)
        ))
    )
    total_deal_value = total_deal_result.scalar() or 0

    return {
        "total": total,
        "created": total,
        "updated": updated_thread_count,
        "skipped": skipped,
        "processed": total_processed,
        "by_category": by_category,
        "by_assignee": by_assignee,
        "by_priority": by_priority,
        "skip_reasons": skip_reasons,
        "threads": {
            "total": total_thread_count,
            "updated_multiple_times": updated_thread_count
        },
        "confidence": {
            "average": round(avg_conf, 3),
            "low_confidence_count": low_conf
        },
        "total_deal_value_inr": total_deal_value,
        # Which LLM provider served classification/chat since the last restart
        "llm_provider": dict(PROVIDER_COUNTERS)
    }
