from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1.schemas import (
    DomainResult,
    Evidence,
    Gap,
    HistoryItem,
    InputInfo,
    NormalizeRequest,
    NormalizeResponse,
    Summary,
    WarningItem,
)
from app.api.v1.schemas import (
    Finding as FindingSchema,
)
from app.core.config import settings
from app.db.deps import get_db
from app.db.models import ConsultationRun, Finding, GapItem
from app.nlp.anonymize import anonymize_text
from app.nlp.embeddings import SafeEmbeddingProvider, get_default_provider
from app.nlp.engine import compute_gaps, extract_findings
from app.nlp.ontology import MOCK_ONTOLOGY, load_domains
from app.nlp.summary import generate_template_summary

__all__ = ["router", "settings"]

router = APIRouter(prefix="/api/v1")


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ontology")
def ontology() -> dict[str, Any]:
    return MOCK_ONTOLOGY


@router.post("/normalize", response_model=NormalizeResponse, response_model_exclude_none=True)
def normalize(payload: NormalizeRequest, db: Session = Depends(get_db)) -> NormalizeResponse:  # noqa: B008
    domains = load_domains(MOCK_ONTOLOGY)

    warnings: list[WarningItem] = []
    if len(payload.text.strip()) < 30:
        warnings.append(
            WarningItem(
                code="TEXT_TOO_SHORT",
                message="Texto muito curto; pode reduzir a qualidade da extração.",
            )
        )
    processed_text = payload.text
    was_anonymized = False
    enable_anonymization = payload.options.enable_anonymization or settings.force_anonymization
    if enable_anonymization:
        processed_text, was_anonymized, _hits = anonymize_text(payload.text)

    embeddings_provider: SafeEmbeddingProvider | None = None
    enable_embeddings = payload.options.enable_embeddings or settings.enable_embeddings_by_default
    if enable_embeddings:
        try:
            embeddings_provider = SafeEmbeddingProvider(get_default_provider())
        except Exception:
            warnings.append(
                WarningItem(
                    code="EMBEDDINGS_UNAVAILABLE",
                    message="Embeddings indisponíveis; usando apenas heurísticas.",
                )
            )

    hits = extract_findings(processed_text, domains, embeddings_provider=embeddings_provider)
    if embeddings_provider is not None and embeddings_provider.diagnostics.had_error:
        warnings.append(
            WarningItem(
                code="EMBEDDINGS_RUNTIME_ERROR",
                message=(
                    "Embeddings falharam em runtime; usando apenas heurísticas. "
                    f"({embeddings_provider.diagnostics.error_type})"
                ),
            )
        )
    gaps = compute_gaps(domains, hits)
    summary_text = generate_template_summary(domains, hits, gaps)

    run = ConsultationRun(
        id=uuid.uuid4(),
        created_at=datetime.now(tz=UTC),
        text_length=len(payload.text),
        was_anonymized=was_anonymized,
        text_redacted=processed_text if was_anonymized else None,
        ontology_version="mock-1",
        summary_text=summary_text,
        summary_generated_by="template",
    )

    try:
        db.add(run)
        db.flush()

        for h in hits:
            db.add(
                Finding(
                    run_id=run.id,
                    domain_id=h.domain_id,
                    domain_name=h.domain_name,
                    symptom=h.symptom,
                    score=h.score,
                    negated=h.negated,
                    method=h.method,
                    evidence=[e.__dict__ for e in h.evidence],
                )
            )

        for g in gaps:
            db.add(
                GapItem(
                    run_id=run.id,
                    domain_id=g.domain_id,
                    domain_name=g.domain_name,
                    gap_level=g.gap_level,
                    rationale=g.rationale,
                    suggested_questions=g.suggested_questions,
                )
            )

        db.commit()
    except Exception:
        db.rollback()
        raise

    hits_by_domain: dict[str, list[FindingSchema]] = {}
    for h in hits:
        hits_by_domain.setdefault(h.domain_id, []).append(
            FindingSchema(
                symptom=h.symptom,
                score=h.score,
                negated=h.negated,
                method=h.method,
                evidence=[Evidence(quote=e.quote, start=e.start, end=e.end) for e in h.evidence],
            )
        )

    return NormalizeResponse(
        request_id=str(run.id),
        created_at=run.created_at,
        ontology={"version": "mock-1", "source": "embedded-json"},
        input=InputInfo(
            text_length=len(payload.text),
            was_anonymized=was_anonymized,
            redacted_text=processed_text if was_anonymized else None,
        ),
        domains=[
            DomainResult(
                domain_id=d.id,
                domain_name=d.name,
                findings=hits_by_domain.get(d.id, []),
            )
            for d in domains
        ],
        gaps=[
            Gap(
                domain_id=g.domain_id,
                domain_name=g.domain_name,
                gap_level=g.gap_level,
                rationale=g.rationale,
                suggested_questions=g.suggested_questions,
            )
            for g in gaps
        ],
        summary=Summary(text=summary_text, generated_by="template"),
        warnings=warnings,
    )


@router.get("/history", response_model=list[HistoryItem])
def history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),  # noqa: B008
) -> list[HistoryItem]:
    findings_count = (
        select(func.count(Finding.id))
        .where(Finding.run_id == ConsultationRun.id)
        .correlate(ConsultationRun)
        .scalar_subquery()
    )
    gaps_count = (
        select(func.count(GapItem.id))
        .where(GapItem.run_id == ConsultationRun.id)
        .correlate(ConsultationRun)
        .scalar_subquery()
    )

    stmt = (
        select(
            ConsultationRun.id,
            ConsultationRun.created_at,
            ConsultationRun.text_length,
            findings_count.label("findings_count"),
            gaps_count.label("gaps_count"),
        )
        .order_by(ConsultationRun.created_at.desc())
        .limit(limit)
    )

    rows = db.execute(stmt).all()
    return [
        HistoryItem(
            request_id=str(r.id),
            created_at=r.created_at,
            text_length=r.text_length,
            findings_count=int(r.findings_count or 0),
            gaps_count=int(r.gaps_count or 0),
        )
        for r in rows
    ]


@router.get("/runs/{run_id}", response_model=NormalizeResponse, response_model_exclude_none=True)
def get_run(run_id: str, db: Session = Depends(get_db)) -> NormalizeResponse:  # noqa: B008
    try:
        run_uuid = uuid.UUID(run_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="run_id invalido.") from e

    run = db.get(ConsultationRun, run_uuid)
    if run is None:
        raise HTTPException(status_code=404, detail="Run nao encontrado.")

    domains = load_domains(MOCK_ONTOLOGY)

    findings = (
        db.execute(select(Finding).where(Finding.run_id == run_uuid).order_by(Finding.id.asc()))
        .scalars()
        .all()
    )
    gaps = (
        db.execute(select(GapItem).where(GapItem.run_id == run_uuid).order_by(GapItem.id.asc()))
        .scalars()
        .all()
    )

    hits_by_domain: dict[str, list[FindingSchema]] = {}
    for f in findings:
        hits_by_domain.setdefault(f.domain_id, []).append(
            FindingSchema(
                symptom=f.symptom,
                score=float(f.score),
                negated=bool(f.negated),
                method=f.method,
                evidence=[
                    Evidence(
                        quote=str(e.get("quote", "")),
                        start=_coerce_int(e.get("start")),
                        end=_coerce_int(e.get("end")),
                    )
                    for e in (f.evidence or [])
                ],
            )
        )

    return NormalizeResponse(
        request_id=str(run.id),
        created_at=run.created_at,
        ontology={"version": run.ontology_version, "source": "embedded-json"},
        input=InputInfo(
            text_length=run.text_length,
            was_anonymized=run.was_anonymized,
            redacted_text=run.text_redacted,
        ),
        domains=[
            DomainResult(
                domain_id=d.id,
                domain_name=d.name,
                findings=hits_by_domain.get(d.id, []),
            )
            for d in domains
        ],
        gaps=[
            Gap(
                domain_id=g.domain_id,
                domain_name=g.domain_name,
                gap_level=g.gap_level,
                rationale=g.rationale,
                suggested_questions=g.suggested_questions,
            )
            for g in gaps
        ],
        summary=Summary(text=run.summary_text, generated_by=run.summary_generated_by),
        warnings=[],
    )


def _coerce_int(v: object) -> int:
    if isinstance(v, bool):
        return int(v)
    if isinstance(v, int):
        return v
    if isinstance(v, float):
        return int(v)
    if isinstance(v, str):
        try:
            return int(v)
        except ValueError:
            return 0
    return 0
