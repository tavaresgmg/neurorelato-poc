from __future__ import annotations

from collections import defaultdict

from app.nlp.ontology import Domain
from app.nlp.types import FindingHit, GapResult


def generate_template_summary(
    domains: list[Domain], hits: list[FindingHit], gaps: list[GapResult]
) -> str:
    """
    Resumo tecnico curto, no estilo prontuario, sem diagnostico.
    Usa apenas dados estruturados (nao inclui texto bruto).
    """
    hits_by_domain: dict[str, list[FindingHit]] = defaultdict(list)
    for h in hits:
        hits_by_domain[h.domain_id].append(h)

    lines: list[str] = []
    lines.append("Resumo técnico (gerado automaticamente; não é diagnóstico).")
    lines.append("")
    lines.append("Observações por domínio:")

    any_findings = False
    for d in domains:
        dhits = hits_by_domain.get(d.id, [])
        if not dhits:
            continue
        any_findings = True
        parts: list[str] = []
        for h in sorted(dhits, key=lambda x: (-x.score, x.symptom)):
            parts.append(f"nega {h.symptom}" if h.negated else h.symptom)
        uniq = "; ".join(dict.fromkeys(parts))
        lines.append(f"- {d.name}: {uniq}.")

    if not any_findings:
        lines.append(
            "- Sem observações mapeadas para a ontologia (texto insuficiente ou não contemplado)."
        )

    hi_gaps = [g for g in gaps if g.gap_level in {"high", "medium"}]
    if hi_gaps:
        lines.append("")
        lines.append("Lacunas a explorar:")
        for g in hi_gaps:
            q = g.suggested_questions[:2]
            if q:
                q_join = q[0] if len(q) == 1 else f"{q[0]} / {q[1]}"
                lines.append(f"- {g.domain_name}: sugerir explorar: {q_join}")
            else:
                lines.append(f"- {g.domain_name}.")

    return "\n".join(lines).strip() + "\n"
