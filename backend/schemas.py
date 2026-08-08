from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class AssigneeID(str, Enum):
    u_aarti = "u_aarti"
    u_rohit = "u_rohit"
    u_meera = "u_meera"
    u_karan = "u_karan"
    u_divya = "u_divya"
    u_triage = "u_triage"

class Category(str, Enum):
    enterprise_rfp = "enterprise_rfp"
    smb_enquiry = "smb_enquiry"
    marketing = "marketing"
    alliances = "alliances"
    finance = "finance"
    triage = "triage"

class Priority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"

class TaskCreate(BaseModel):
    candidate_id: str
    source_email_id: str
    thread_id: str
    title: str
    description: Optional[str] = None
    assignee_id: AssigneeID
    category: Category
    priority: Priority
    due_date: Optional[str] = None
    deal_value_inr: Optional[int] = None
    company_name: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[AssigneeID] = None
    category: Optional[Category] = None
    priority: Optional[Priority] = None
    due_date: Optional[str] = None
    deal_value_inr: Optional[int] = None
    company_name: Optional[str] = None
    confidence: Optional[float] = None

class TaskResponse(BaseModel):
    task_id: str
    candidate_id: str
    source_email_id: str
    created_at: str

class Task(BaseModel):
    task_id: str
    candidate_id: str
    source_email_id: str
    thread_id: str
    title: str
    description: Optional[str] = None
    assignee_id: str
    category: str
    priority: str
    due_date: Optional[str] = None
    deal_value_inr: Optional[int] = None
    company_name: Optional[str] = None
    confidence: float
    created_at: str
    updated_at: Optional[str] = None

class EmailInput(BaseModel):
    email_id: str
    thread_id: str
    message_index: int = 0
    from_name: str
    from_email: str
    to: str
    cc: List[str] = []
    subject: str
    body: str
    received_at: str
    attachments: List[str] = []
    is_reply: bool = False

class IngestRequest(BaseModel):
    candidate_id: str
    emails: List[EmailInput]

class IngestResponse(BaseModel):
    processed: int
    tasks_created: int
    tasks_updated: int
    skipped: int
    errors: List[str]

class ChatRequest(BaseModel):
    candidate_id: str
    query: str

class ChatResponse(BaseModel):
    answer: str
    supporting_data: dict

class TeamMember(BaseModel):
    user_id: str
    name: str
    department: str
    scope: str

class TeamRoster(BaseModel):
    team: List[TeamMember]

class ErrorResponse(BaseModel):
    error: str
    field: Optional[str] = None
    received: Optional[str] = None
    allowed: Optional[List[str]] = None
