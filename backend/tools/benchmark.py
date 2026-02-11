from __future__ import annotations

# ruff: noqa: E402
import argparse
import json
import statistics
import sys
import time
from pathlib import Path
from typing import Any, TypedDict

# Make `backend/` importable so we can `import app.*` when running as a script.
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.nlp.embeddings import EmbeddingProvider, get_default_provider
from app.nlp.engine import extract_findings
from app.nlp.ontology import MOCK_ONTOLOGY, load_domains
from app.nlp.types import FindingHit
from tools.golden_dataset import GOLDEN_SCENARIOS


class ScenarioOut(TypedDict):
    name: str
    metrics_mean: dict[str, float]
    required_present: list[str]
    required_negated: list[str]
    optional_present: list[str]


def _metrics_for_scenario(
    found_present: set[str],
    found_negated: set[str],
    required_present: set[str],
    optional_present: set[str],
    required_negated: set[str],
) -> dict[str, float]:
    exp_all_required = required_present | required_negated
    exp_all_optional = optional_present
    exp_all = exp_all_required | exp_all_optional
    found_all = found_present | found_negated

    tp = len(found_all & exp_all)
    fp = len(found_all - exp_all)
    # FN only for required (optional does not penalize).
    fn = len(exp_all_required - found_all)

    precision = tp / (tp + fp) if (tp + fp) else 1.0
    recall = tp / (tp + fn) if (tp + fn) else 1.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 1.0

    neg_ok = len(found_negated & required_negated)
    neg_total = len(required_negated)
    neg_recall = neg_ok / neg_total if neg_total else 1.0

    return {
        "tp": float(tp),
        "fp": float(fp),
        "fn": float(fn),
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "neg_recall": neg_recall,
    }


def _validate_evidence_fidelity(text: str, hits: list[FindingHit]) -> None:
    for h in hits:
        if not h.evidence:
            continue
        if len(h.evidence) > 3:
            raise AssertionError("evidence should be capped to <=3 spans for legibility")
        for ev in h.evidence:
            if not (0 <= ev.start <= ev.end <= len(text)):
                raise AssertionError("invalid evidence offsets")
            if text[ev.start : ev.end].strip() != ev.quote:
                raise AssertionError("evidence quote does not match offsets slice")


def run(*, embeddings: bool, warmup: bool, runs: int) -> int:
    domains = load_domains(MOCK_ONTOLOGY)

    provider: EmbeddingProvider | None = None
    if embeddings:
        if warmup:
            try:
                p = get_default_provider()
                p.embed(["warmup"])
            except Exception:
                pass
        provider = get_default_provider()

    per_scenario: list[tuple[str, dict[str, float]]] = []
    latencies_ms: list[float] = []

    for sc in GOLDEN_SCENARIOS:
        agg: dict[str, list[float]] = {"precision": [], "recall": [], "f1": [], "neg_recall": []}
        for _ in range(runs):
            t0 = time.perf_counter()
            hits = extract_findings(sc.text, domains, embeddings_provider=provider)
            dt = (time.perf_counter() - t0) * 1000.0
            latencies_ms.append(dt)

            _validate_evidence_fidelity(sc.text, hits)
            found_present = {h.symptom for h in hits if not h.negated}
            found_negated = {h.symptom for h in hits if h.negated}
            m = _metrics_for_scenario(
                found_present,
                found_negated,
                sc.required_present,
                sc.optional_present,
                sc.required_negated,
            )
            for k in agg:
                agg[k].append(m[k])

        per_scenario.append(
            (
                sc.name,
                {k: float(statistics.mean(v)) for k, v in agg.items()},
            )
        )

    print("Benchmark (PoC) - normalizacao semantica")
    print(f"mode: embeddings={'on' if embeddings else 'off'}  runs_per_scenario={runs}")
    if latencies_ms:
        print(
            "latency_ms: "
            f"p50={statistics.median(latencies_ms):.2f}  "
            f"p95={statistics.quantiles(latencies_ms, n=20)[-1]:.2f}  "
            f"max={max(latencies_ms):.2f}"
        )
    print("")

    for name, m in per_scenario:
        print(
            f"- {name}: "
            f"precision={m['precision']:.2f} recall={m['recall']:.2f} f1={m['f1']:.2f} "
            f"neg_recall={m['neg_recall']:.2f}"
        )

    # Overall summary (macro F1)
    macro_f1 = float(statistics.mean([m["f1"] for _, m in per_scenario])) if per_scenario else 0.0
    print("")
    print(f"macro_f1={macro_f1:.2f}")
    return 0


def run_json(*, embeddings: bool, warmup: bool, runs: int) -> dict[str, Any]:
    domains = load_domains(MOCK_ONTOLOGY)

    provider: EmbeddingProvider | None = None
    if embeddings:
        if warmup:
            try:
                p = get_default_provider()
                p.embed(["warmup"])
            except Exception:
                pass
        provider = get_default_provider()

    latencies_ms: list[float] = []
    scenarios_out: list[ScenarioOut] = []

    for sc in GOLDEN_SCENARIOS:
        agg: dict[str, list[float]] = {
            "tp": [],
            "fp": [],
            "fn": [],
            "precision": [],
            "recall": [],
            "f1": [],
            "neg_recall": [],
        }
        for _ in range(runs):
            t0 = time.perf_counter()
            hits = extract_findings(sc.text, domains, embeddings_provider=provider)
            dt = (time.perf_counter() - t0) * 1000.0
            latencies_ms.append(dt)

            _validate_evidence_fidelity(sc.text, hits)
            found_present = {h.symptom for h in hits if not h.negated}
            found_negated = {h.symptom for h in hits if h.negated}
            m = _metrics_for_scenario(
                found_present,
                found_negated,
                sc.required_present,
                sc.optional_present,
                sc.required_negated,
            )
            for k in agg:
                agg[k].append(m[k])

        scenarios_out.append(
            {
                "name": sc.name,
                "metrics_mean": {k: float(statistics.mean(v)) for k, v in agg.items()},
                "required_present": sorted(sc.required_present),
                "required_negated": sorted(sc.required_negated),
                "optional_present": sorted(sc.optional_present),
            }
        )

    latencies_ms_sorted = sorted(latencies_ms)

    def pct(p: float) -> float:
        if not latencies_ms_sorted:
            return 0.0
        idx = int(round((p / 100.0) * (len(latencies_ms_sorted) - 1)))
        idx = max(0, min(len(latencies_ms_sorted) - 1, idx))
        return float(latencies_ms_sorted[idx])

    macro_f1 = float(
        statistics.mean([s["metrics_mean"]["f1"] for s in scenarios_out]) if scenarios_out else 0.0
    )

    return {
        "mode": {"embeddings": embeddings, "warmup": warmup, "runs_per_scenario": runs},
        "latency_ms": {
            "p50": pct(50),
            "p95": pct(95),
            "max": float(max(latencies_ms_sorted or [0.0])),
        },
        "macro_f1": macro_f1,
        "scenarios": scenarios_out,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--embeddings", action="store_true", help="Habilita embeddings (fastembed).")
    ap.add_argument(
        "--warmup",
        action="store_true",
        help="Executa um embed('warmup') antes de rodar cenarios (reduz cold start).",
    )
    ap.add_argument("--runs", type=int, default=20, help="Repeticoes por cenário.")
    ap.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        help="Saida do benchmark: texto (default) ou json.",
    )
    ap.add_argument(
        "--out",
        default="",
        help="Quando --format=json, escreve o JSON neste caminho. Se vazio, imprime no stdout.",
    )
    args = ap.parse_args()
    if args.format == "json":
        payload = run_json(
            embeddings=bool(args.embeddings),
            warmup=bool(args.warmup),
            runs=int(args.runs),
        )
        raw = json.dumps(payload, ensure_ascii=True, indent=2, sort_keys=True)
        if args.out:
            Path(args.out).write_text(raw + "\n", encoding="utf-8")
            return 0
        print(raw)
        return 0

    return run(embeddings=bool(args.embeddings), warmup=bool(args.warmup), runs=int(args.runs))


if __name__ == "__main__":
    raise SystemExit(main())
