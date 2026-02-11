from __future__ import annotations

from typing import TYPE_CHECKING

from prometheus_client import Counter, Histogram
from prometheus_fastapi_instrumentator import Instrumentator, metrics

if TYPE_CHECKING:  # pragma: no cover
    from fastapi import FastAPI


# -----------------------------
# Custom business/pipeline metrics
# -----------------------------

PN_NORMALIZE_SECONDS = Histogram(
    "pn_normalize_seconds",
    "Tempo total (segundos) para processar /api/v1/normalize (inclui DB).",
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5),
)

PN_ANONYMIZE_SECONDS = Histogram(
    "pn_anonymize_seconds",
    "Tempo (segundos) de anonimização (LGPD) antes do processamento.",
    buckets=(0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1),
)

PN_EXTRACT_SECONDS = Histogram(
    "pn_extract_seconds",
    "Tempo (segundos) do motor NLP (heurística + embeddings, quando aplicável).",
    buckets=(0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1),
)

PN_GAPS_SECONDS = Histogram(
    "pn_gaps_seconds",
    "Tempo (segundos) para computar gap analysis.",
    buckets=(0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05),
)

PN_SUMMARY_SECONDS = Histogram(
    "pn_summary_seconds",
    "Tempo (segundos) para gerar resumo técnico (template).",
    buckets=(0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05),
)

PN_EMBEDDINGS_ENABLED_TOTAL = Counter(
    "pn_embeddings_enabled_total",
    "Total de requests onde embeddings foram habilitados (opção do cliente ou policy server-side).",
)

PN_EMBEDDINGS_RUNTIME_ERROR_TOTAL = Counter(
    "pn_embeddings_runtime_error_total",
    "Total de falhas em runtime ao usar embeddings (fallback para heurística).",
)

PN_FINDINGS_TOTAL = Counter(
    "pn_findings_total",
    "Total de achados extraídos (incremental), por domínio.",
    labelnames=("domain_id",),
)

PN_GAPS_TOTAL = Counter(
    "pn_gaps_total",
    "Total de gaps retornados (incremental), por domínio e severidade.",
    labelnames=("domain_id", "gap_level"),
)


def setup_prometheus_metrics(app: FastAPI) -> None:
    """
    Exponibiliza métricas Prometheus em `/metrics`.

    - Não inclui PII em labels.
    - Evita instrumentar o próprio endpoint de métricas.
    """
    instrumentator = Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        excluded_handlers=["/metrics"],
    )
    instrumentator.add(metrics.default())
    instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
