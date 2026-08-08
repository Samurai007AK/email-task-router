import json
import asyncio
import os
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager
import httpx

from config import settings
from database import get_db, init_db
from models import TaskModel, EmailModel, ThreadModel, ChatLogModel
from schemas import (
    TaskUpdate, TaskResponse, Task, ErrorResponse,
    IngestRequest, IngestResponse,
    ChatRequest, ChatResponse,
    TeamRoster, TeamMember,
    AssigneeID, Category, Priority
)
from ingest import process_emails, generate_task_id
from classification import classify_email
from email_parser import clean_html, strip_quoted_text
from chat import handle_chat
from stats import get_stats as fetch_stats

TEAM_ROSTER = [
    {"user_id": "u_aarti", "name": "Aarti Menon", "department": "Sales — Enterprise", "scope": "RFPs, RFIs, tenders, and inbound deals above ₹10,00,000"},
    {"user_id": "u_rohit", "name": "Rohit Sharma", "department": "Sales — SMB", "scope": "Product enquiries, demo requests, deals at or below ₹10,00,000"},
    {"user_id": "u_meera", "name": "Meera Iyer", "department": "Marketing", "scope": "Webinars, event and conference sponsorships, content collaborations, PR and media"},
    {"user_id": "u_karan", "name": "Karan Doshi", "department": "Alliances", "scope": "Reseller, channel partner, and technology integration proposals"},
    {"user_id": "u_divya", "name": "Divya Rao", "department": "Finance", "scope": "Invoices, purchase orders, payment reminders, GST and vendor billing"},
    {"user_id": "u_triage", "name": "Triage Queue", "department": "Operations", "scope": "Ambiguous items requiring human review"},
]

ALLOWED_ASSIGNEES = ["u_aarti", "u_rohit", "u_meera", "u_karan", "u_divya", "u_triage"]
ALLOWED_CATEGORIES = ["enterprise_rfp", "smb_enquiry", "marketing", "alliances", "finance", "triage"]
ALLOWED_PRIORITIES = ["high", "medium", "low"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("data", exist_ok=True)
    await init_db()
    asyncio.create_task(keep_alive())
    yield

async def keep_alive():
    port = os.environ.get("PORT", "8000")
    url = f"http://localhost:{port}/health"
    while True:
        await asyncio.sleep(300)
        try:
            async with httpx.AsyncClient() as client:
                await client.get(url, timeout=5.0)
        except Exception:
            pass

app = FastAPI(
    title="Email Task Router API",
    description="AI-powered email-to-task routing system",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    # TEMPORARY debug handler — returns the traceback so the production 500 can be
    # diagnosed. REMOVE before final submission.
    import traceback
    return JSONResponse(
        status_code=500,
        content={"error": "internal", "detail": traceback.format_exc()},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    for error in exc.errors():
        loc = error.get("loc", [])
        if len(loc) >= 2 and loc[-2] == "body":
            field = loc[-1]
            if field in ["assignee_id", "category", "priority"]:
                input_value = error.get("input", "")
                allowed_map = {
                    "assignee_id": ALLOWED_ASSIGNEES,
                    "category": ALLOWED_CATEGORIES,
                    "priority": ALLOWED_PRIORITIES
                }
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": "invalid_enum_value",
                        "field": field,
                        "received": str(input_value),
                        "allowed": allowed_map[field]
                    }
                )
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/users")
async def get_users():
    return TeamRoster(team=[TeamMember(**m) for m in TEAM_ROSTER])


@app.post("/tasks", response_model=TaskResponse, status_code=201)
async def create_task(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "invalid_json", "detail": "Invalid JSON body"})

    required_fields = ["candidate_id", "source_email_id", "thread_id", "title", "assignee_id", "category", "priority", "confidence"]
    for field in required_fields:
        if field not in body:
            return JSONResponse(status_code=400, content={"error": "missing_field", "field": field})

    assignee_id = body.get("assignee_id")
    if assignee_id not in ALLOWED_ASSIGNEES:
        return JSONResponse(status_code=400, content={
            "error": "invalid_enum_value",
            "field": "assignee_id",
            "received": assignee_id,
            "allowed": ALLOWED_ASSIGNEES
        })

    category = body.get("category")
    if category not in ALLOWED_CATEGORIES:
        return JSONResponse(status_code=400, content={
            "error": "invalid_enum_value",
            "field": "category",
            "received": category,
            "allowed": ALLOWED_CATEGORIES
        })

    priority = body.get("priority")
    if priority not in ALLOWED_PRIORITIES:
        return JSONResponse(status_code=400, content={
            "error": "invalid_enum_value",
            "field": "priority",
            "received": priority,
            "allowed": ALLOWED_PRIORITIES
        })

    candidate_id = body["candidate_id"].lower()
    source_email_id = body["source_email_id"]

    result = await db.execute(
        select(TaskModel).where(TaskModel.source_email_id == source_email_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return JSONResponse(status_code=409, content={
            "error": "duplicate_source_email_id",
            "field": "source_email_id",
            "received": source_email_id
        })

    task_id = generate_task_id()
    now = datetime.utcnow().isoformat()

    new_task = TaskModel(
        task_id=task_id,
        candidate_id=candidate_id,
        source_email_id=source_email_id,
        thread_id=body["thread_id"],
        title=body["title"],
        description=body.get("description"),
        assignee_id=assignee_id,
        category=category,
        priority=priority,
        due_date=body.get("due_date"),
        deal_value_inr=body.get("deal_value_inr"),
        company_name=body.get("company_name"),
        confidence=body["confidence"],
        created_at=now,
        updated_at=now
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)

    return TaskResponse(
        task_id=task_id,
        candidate_id=candidate_id,
        source_email_id=source_email_id,
        created_at=now
    )


@app.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: TaskUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TaskModel).where(TaskModel.task_id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    update_data = task_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            if hasattr(value, 'value'):
                setattr(task, field, value.value)
            else:
                setattr(task, field, value)

    task.updated_at = datetime.utcnow().isoformat()
    await db.commit()
    await db.refresh(task)

    return Task(
        task_id=task.task_id,
        candidate_id=task.candidate_id,
        source_email_id=task.source_email_id,
        thread_id=task.thread_id,
        title=task.title,
        description=task.description,
        assignee_id=task.assignee_id,
        category=task.category,
        priority=task.priority,
        due_date=task.due_date,
        deal_value_inr=task.deal_value_inr,
        company_name=task.company_name,
        confidence=task.confidence,
        created_at=task.created_at,
        updated_at=task.updated_at
    )


@app.get("/tasks", response_model=List[Task])
async def list_tasks(
    candidate_id: str = Query(..., description="Candidate ID (mandatory)"),
    thread_id: Optional[str] = Query(None),
    source_email_id: Optional[str] = Query(None),
    assignee_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(TaskModel).where(TaskModel.candidate_id == candidate_id.lower())

    if thread_id:
        query = query.where(TaskModel.thread_id == thread_id)
    if source_email_id:
        query = query.where(TaskModel.source_email_id == source_email_id)
    if assignee_id:
        query = query.where(TaskModel.assignee_id == assignee_id)
    if category:
        query = query.where(TaskModel.category == category)

    result = await db.execute(query)
    tasks = result.scalars().all()

    return [
        Task(
            task_id=t.task_id,
            candidate_id=t.candidate_id,
            source_email_id=t.source_email_id,
            thread_id=t.thread_id,
            title=t.title,
            description=t.description,
            assignee_id=t.assignee_id,
            category=t.category,
            priority=t.priority,
            due_date=t.due_date,
            deal_value_inr=t.deal_value_inr,
            company_name=t.company_name,
            confidence=t.confidence,
            created_at=t.created_at,
            updated_at=t.updated_at
        )
        for t in tasks
    ]


@app.delete("/tasks/{task_id}", status_code=204)
async def delete_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TaskModel).where(TaskModel.task_id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    await db.delete(task)
    await db.commit()
    return None


@app.get("/api/tasks", response_model=List[Task])
async def api_list_tasks(
    candidate_id: str = Query(..., description="Candidate ID (mandatory)"),
    thread_id: Optional[str] = Query(None),
    source_email_id: Optional[str] = Query(None),
    assignee_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(TaskModel).where(TaskModel.candidate_id == candidate_id.lower())

    if thread_id:
        query = query.where(TaskModel.thread_id == thread_id)
    if source_email_id:
        query = query.where(TaskModel.source_email_id == source_email_id)
    if assignee_id:
        query = query.where(TaskModel.assignee_id == assignee_id)
    if category:
        query = query.where(TaskModel.category == category)

    result = await db.execute(query)
    tasks = result.scalars().all()

    return [
        Task(
            task_id=t.task_id,
            candidate_id=t.candidate_id,
            source_email_id=t.source_email_id,
            thread_id=t.thread_id,
            title=t.title,
            description=t.description,
            assignee_id=t.assignee_id,
            category=t.category,
            priority=t.priority,
            due_date=t.due_date,
            deal_value_inr=t.deal_value_inr,
            company_name=t.company_name,
            confidence=t.confidence,
            created_at=t.created_at,
            updated_at=t.updated_at
        )
        for t in tasks
    ]


@app.post("/ingest", response_model=IngestResponse)
async def ingest_emails(request: IngestRequest, db: AsyncSession = Depends(get_db)):
    if len(request.emails) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 emails per batch")

    candidate_id = request.candidate_id.lower()
    response = await process_emails(request.emails, candidate_id, db)
    return response


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    request.candidate_id = request.candidate_id.lower()
    return await handle_chat(request, db)


@app.get("/api/stats")
async def get_stats(candidate_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    return await fetch_stats(candidate_id.lower(), db)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
