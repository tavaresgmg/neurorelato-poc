from __future__ import annotations

from app.nlp.engine import compute_gaps, extract_findings
from app.nlp.ontology import MOCK_ONTOLOGY, load_domains
from app.nlp.summary import generate_template_summary


def test_template_summary_mentions_findings_and_gaps() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele não olha nos olhos quando falo. Muito agitado, não para quieto."
    hits = extract_findings(text, domains, embeddings_provider=None)
    gaps = compute_gaps(domains, hits)

    s = generate_template_summary(domains, hits, gaps)
    assert "Resumo técnico" in s
    assert "contato visual reduzido" in s
    assert "agitação motora" in s
    assert "Lacunas a explorar" in s
