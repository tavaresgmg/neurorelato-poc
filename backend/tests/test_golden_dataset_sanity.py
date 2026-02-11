from __future__ import annotations

from app.nlp.engine import extract_findings
from app.nlp.ontology import MOCK_ONTOLOGY, load_domains
from tools.golden_dataset import GOLDEN_SCENARIOS


def test_golden_dataset_required_symptoms_are_covered_by_heuristics() -> None:
    """
    Gate leve de regressao:
    - O dataset golden deve continuar passando no modo heuristico (sem embeddings) para manter
      estabilidade e previsibilidade na PoC.

    Obs: isso nao impede que embeddings melhorem recall; apenas evita quebrar o baseline.
    """
    domains = load_domains(MOCK_ONTOLOGY)
    for sc in GOLDEN_SCENARIOS:
        hits = extract_findings(sc.text, domains, embeddings_provider=None)
        found_present = {h.symptom for h in hits if not h.negated}
        found_negated = {h.symptom for h in hits if h.negated}

        assert sc.required_present.issubset(found_present), sc.name
        assert sc.required_negated.issubset(found_negated), sc.name
