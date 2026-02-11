from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ConsultationRun(Base):
    __tablename__ = "consultation_runs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    text_length: Mapped[int] = mapped_column(Integer, nullable=False)
    was_anonymized: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Persistimos apenas o texto *redigido* (anonimizado), para suportar XAI (offsets/evidências)
    # sem reter PII desnecessária.
    text_redacted: Mapped[str | None] = mapped_column(Text, nullable=True)

    ontology_version: Mapped[str] = mapped_column(String(50), nullable=False, default="mock-1")

    summary_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_generated_by: Mapped[str] = mapped_column(String(20), nullable=False, default="none")

    findings: Mapped[list[Finding]] = relationship(
        back_populates="run", cascade="all, delete-orphan", passive_deletes=True
    )
    gaps: Mapped[list[GapItem]] = relationship(
        back_populates="run", cascade="all, delete-orphan", passive_deletes=True
    )


Index("ix_consultation_runs_created_at", ConsultationRun.created_at.desc())


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("consultation_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    domain_id: Mapped[str] = mapped_column(String(20), nullable=False)
    domain_name: Mapped[str] = mapped_column(String(200), nullable=False)

    symptom: Mapped[str] = mapped_column(String(200), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    negated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    method: Mapped[str] = mapped_column(String(50), nullable=False)

    evidence: Mapped[list[dict[str, object]]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), nullable=False, default=list
    )

    run: Mapped[ConsultationRun] = relationship(back_populates="findings")


class GapItem(Base):
    __tablename__ = "gaps"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("consultation_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    domain_id: Mapped[str] = mapped_column(String(20), nullable=False)
    domain_name: Mapped[str] = mapped_column(String(200), nullable=False)

    gap_level: Mapped[str] = mapped_column(String(10), nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_questions: Mapped[list[str]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), nullable=False, default=list
    )

    run: Mapped[ConsultationRun] = relationship(back_populates="gaps")
