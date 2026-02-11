from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime
from time import perf_counter
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
from app.core.metrics import (
    PN_ANONYMIZE_SECONDS,
    PN_EMBEDDINGS_ENABLED_TOTAL,
    PN_EMBEDDINGS_RUNTIME_ERROR_TOTAL,
    PN_EXTRACT_SECONDS,
    PN_FINDINGS_TOTAL,
    PN_GAPS_SECONDS,
    PN_GAPS_TOTAL,
    PN_NORMALIZE_SECONDS,
    PN_SUMMARY_SECONDS,
)
from app.db.deps import get_db
from app.db.models import ConsultationRun, Finding, GapItem
from app.nlp.anonymize import anonymize_text
from app.nlp.embeddings import SafeEmbeddingProvider, get_default_provider
from app.nlp.engine import compute_gaps, extract_findings
from app.nlp.ontology import ONTOLOGY_SOURCE, get_ontology, load_domains
from app.nlp.summary import generate_template_summary
from app.nlp.types import FindingHit, GapResult

__all__ = ["router", "settings"]

router = APIRouter(prefix="/api/v1")


def _initial_warnings(raw_text: str) -> list[WarningItem]:
    warnings: list[WarningItem] = []
    if len(raw_text.strip()) < 30:
        warnings.append(
            WarningItem(
                code="TEXT_TOO_SHORT",
                message="Texto muito curto; pode reduzir a qualidade da extração.",
            )
        )
    return warnings


def _build_embeddings_provider(
    *,
    enable_embeddings: bool,
    warnings: list[WarningItem],
) -> SafeEmbeddingProvider | None:
    if not enable_embeddings:
        return None

    PN_EMBEDDINGS_ENABLED_TOTAL.inc()
    try:
        return SafeEmbeddingProvider(get_default_provider())
    except Exception:
        warnings.append(
            WarningItem(
                code="EMBEDDINGS_UNAVAILABLE",
                message="Embeddings indisponíveis; usando apenas heurísticas.",
            )
        )
        return None


def _collect_runtime_warnings(
    *,
    provider: SafeEmbeddingProvider | None,
    warnings: list[WarningItem],
) -> None:
    if provider is None or not provider.diagnostics.had_error:
        return
    PN_EMBEDDINGS_RUNTIME_ERROR_TOTAL.inc()
    warnings.append(
        WarningItem(
            code="EMBEDDINGS_RUNTIME_ERROR",
            message=(
                "Embeddings falharam em runtime; usando apenas heurísticas. "
                f"({provider.diagnostics.error_type})"
            ),
        )
    )


def _record_pipeline_metrics(hits: list[FindingHit], gaps: list[GapResult]) -> None:
    counts_by_domain: dict[str, int] = {}
    for h in hits:
        counts_by_domain[h.domain_id] = counts_by_domain.get(h.domain_id, 0) + 1
    for domain_id, count in counts_by_domain.items():
        PN_FINDINGS_TOTAL.labels(domain_id=domain_id).inc(count)
    for g in gaps:
        PN_GAPS_TOTAL.labels(domain_id=g.domain_id, gap_level=g.gap_level).inc()


def _group_hits_by_domain(hits: list[FindingHit]) -> dict[str, list[FindingSchema]]:
    by_domain: dict[str, list[FindingSchema]] = {}
    for h in hits:
        by_domain.setdefault(h.domain_id, []).append(
            FindingSchema(
                symptom=h.symptom,
                score=h.score,
                negated=h.negated,
                method=h.method,
                evidence=[Evidence(quote=e.quote, start=e.start, end=e.end) for e in h.evidence],
            )
        )
    return by_domain


def _group_db_findings_by_domain(findings: Sequence[Finding]) -> dict[str, list[FindingSchema]]:
    by_domain: dict[str, list[FindingSchema]] = {}
    for f in findings:
        by_domain.setdefault(f.domain_id, []).append(
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
    return by_domain


def _serialize_gaps(gaps: Sequence[GapResult | GapItem]) -> list[Gap]:
    return [
        Gap(
            domain_id=g.domain_id,
            domain_name=g.domain_name,
            gap_level=g.gap_level,
            rationale=g.rationale,
            suggested_questions=g.suggested_questions,
        )
        for g in gaps
    ]


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ontology")
def ontology() -> dict[str, Any]:
    _version, data = get_ontology()
    return data


@router.post("/normalize", response_model=NormalizeResponse, response_model_exclude_none=True)
def normalize(payload: NormalizeRequest, db: Session = Depends(get_db)) -> NormalizeResponse:  # noqa: B008
    ontology_version, ontology_data = get_ontology()
    domains = load_domains(ontology_data)
    t0_total = perf_counter()

    warnings = _initial_warnings(payload.text)
    processed_text = payload.text
    was_anonymized = False
    # Segurança/LGPD: sempre rodamos a anonimização antes de processar e persistir.
    with PN_ANONYMIZE_SECONDS.time():
        processed_text, was_anonymized, _hits = anonymize_text(payload.text)

    enable_embeddings = payload.options.enable_embeddings or settings.enable_embeddings_by_default
    embeddings_provider = _build_embeddings_provider(
        enable_embeddings=enable_embeddings,
        warnings=warnings,
    )

    with PN_EXTRACT_SECONDS.time():
        hits = extract_findings(processed_text, domains, embeddings_provider=embeddings_provider)
    _collect_runtime_warnings(provider=embeddings_provider, warnings=warnings)
    with PN_GAPS_SECONDS.time():
        gaps = compute_gaps(domains, hits)
    with PN_SUMMARY_SECONDS.time():
        summary_text = generate_template_summary(domains, hits, gaps)

    _record_pipeline_metrics(hits, gaps)

    run = ConsultationRun(
        id=uuid.uuid4(),
        created_at=datetime.now(tz=UTC),
        text_length=len(payload.text),
        was_anonymized=was_anonymized,
        text_redacted=processed_text if was_anonymized else None,
        ontology_version=ontology_version,
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
    finally:
        PN_NORMALIZE_SECONDS.observe(perf_counter() - t0_total)

    hits_by_domain = _group_hits_by_domain(hits)

    return NormalizeResponse(
        request_id=str(run.id),
        created_at=run.created_at,
        ontology={"version": ontology_version, "source": ONTOLOGY_SOURCE},
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
        gaps=_serialize_gaps(gaps),
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

    _resolved_version, ontology_data = get_ontology(run.ontology_version)
    domains = load_domains(ontology_data)

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

    hits_by_domain = _group_db_findings_by_domain(findings)

    return NormalizeResponse(
        request_id=str(run.id),
        created_at=run.created_at,
        ontology={"version": run.ontology_version, "source": ONTOLOGY_SOURCE},
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
        gaps=_serialize_gaps(gaps),
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
