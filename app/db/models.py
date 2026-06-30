from __future__ import annotations

from datetime import UTC, datetime
import uuid

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    status: Mapped[str] = mapped_column(String(32), default="new")
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    project_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    requirements_json: Mapped[dict] = mapped_column(JSON)
    recommendation_json: Mapped[dict] = mapped_column(JSON)
    source: Mapped[str] = mapped_column(String(32), default="wizard")
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False)

    conversations: Mapped[list["Conversation"]] = relationship(back_populates="lead")
    reports: Mapped[list["Report"]] = relationship(back_populates="lead")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id: Mapped[str | None] = mapped_column(ForeignKey("leads.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    messages_json: Mapped[list] = mapped_column(JSON, default=list)
    extracted_requirements_json: Mapped[dict] = mapped_column(JSON, default=dict)

    lead: Mapped[Lead | None] = relationship(back_populates="conversations")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id: Mapped[str] = mapped_column(ForeignKey("leads.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    generated_content: Mapped[str] = mapped_column(Text)
    version: Mapped[str] = mapped_column(String(32), default="v1")

    lead: Mapped[Lead] = relationship(back_populates="reports")


class ProductRuleVersion(Base):
    __tablename__ = "product_rule_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    version: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
