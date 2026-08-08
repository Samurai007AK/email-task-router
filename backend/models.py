from sqlalchemy import Column, Integer, String, Text, Float, Boolean, Index, DateTime
from sqlalchemy.sql import func
from database import Base


class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(20), unique=True, nullable=False, index=True)
    candidate_id = Column(String(255), nullable=False, index=True)
    source_email_id = Column(String(255), nullable=False, index=True)
    thread_id = Column(String(255), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    assignee_id = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    priority = Column(String(20), nullable=False)
    due_date = Column(String(30), nullable=True)
    deal_value_inr = Column(Integer, nullable=True)
    company_name = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=False, default=0.5)
    created_at = Column(String(30), nullable=False)
    updated_at = Column(String(30), nullable=True)


class EmailModel(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email_id = Column(String(255), unique=True, nullable=False, index=True)
    thread_id = Column(String(255), nullable=False, index=True)
    from_name = Column(String(255), nullable=False)
    from_email = Column(String(255), nullable=False)
    to_email = Column(String(255), nullable=False)
    cc_emails = Column(Text, nullable=True)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    received_at = Column(String(30), nullable=False)
    attachments = Column(Text, nullable=True)
    is_reply = Column(Boolean, nullable=False, default=False)
    classification_result = Column(Text, nullable=True)
    is_skipped = Column(Boolean, nullable=False, default=False)
    skip_reason = Column(String(100), nullable=True)
    candidate_id = Column(String(255), nullable=False, index=True)
    processed_at = Column(String(30), nullable=True)


class ThreadModel(Base):
    __tablename__ = "threads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    thread_id = Column(String(255), unique=True, nullable=False, index=True)
    candidate_id = Column(String(255), nullable=False, index=True)
    latest_email_id = Column(String(255), nullable=False)
    task_id = Column(String(20), nullable=True)
    update_count = Column(Integer, nullable=False, default=1)
    created_at = Column(String(30), nullable=False)
    updated_at = Column(String(30), nullable=True)


class ChatLogModel(Base):
    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    query = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    supporting_data = Column(Text, nullable=True)
    candidate_id = Column(String(255), nullable=False, index=True)
    created_at = Column(String(30), nullable=False)
