from __future__ import annotations

from app.nlp.engine import compute_gaps, extract_findings
from app.nlp.ontology import MOCK_ONTOLOGY, load_domains


def test_extract_contact_visual_reduzido_from_negated_phrase() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele não olha nos olhos quando falo com ele."
    hits = extract_findings(text, domains, embeddings_provider=None)

    cv = [h for h in hits if h.symptom == "contato visual reduzido"]
    assert len(cv) == 1
    assert cv[0].domain_id == "DOM_01"
    assert cv[0].negated is False
    assert cv[0].evidence


def test_negation_marks_symptom_as_negated_when_denied() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele não apresenta impulsividade atualmente."
    hits = extract_findings(text, domains, embeddings_provider=None)

    imp = [h for h in hits if h.symptom == "impulsividade"]
    assert len(imp) == 1
    assert imp[0].negated is True

    gaps = compute_gaps(domains, hits)
    dom03 = [g for g in gaps if g.domain_id == "DOM_03"]
    assert dom03
    assert dom03[0].gap_level in {"high", "medium"}


def test_extract_impulsividade_from_interrompe_conversas() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "A mãe relata que ele por vezes interrompe conversas e fala por cima."
    hits = extract_findings(text, domains, embeddings_provider=None)

    imp = [h for h in hits if h.symptom == "impulsividade"]
    assert len(imp) == 1
    assert imp[0].negated is False
    assert imp[0].evidence


def test_mixed_negation_and_positive_mentions_prefers_non_negated_label() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Nega impulsividade. Porém hoje está impulsivo e interrompe os outros."
    hits = extract_findings(text, domains, embeddings_provider=None)

    imp = [h for h in hits if h.symptom == "impulsividade"]
    assert len(imp) == 1
    assert imp[0].negated is False
    # E evidência preferencialmente não-negada deve aparecer primeiro.
    assert "impulsiv" in imp[0].evidence[0].quote.lower()


def test_negation_does_not_cross_contrastive_conjunction_mas() -> None:
    """
    "não X, mas Y" não deve marcar Y como negado.
    """
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele não é muito agitado, mas está inquieto."
    hits = extract_findings(text, domains, embeddings_provider=None)

    ag = [h for h in hits if h.symptom == "agitação motora"]
    assert len(ag) == 1
    assert ag[0].negated is False
    assert "inquiet" in ag[0].evidence[0].quote.lower()


def test_not_only_construction_is_not_negation() -> None:
    """
    "não só ... como também ..." não é negação; equivale a "não apenas".
    """
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele não só está inquieto como também é hiperativo."
    hits = extract_findings(text, domains, embeddings_provider=None)

    ag = [h for h in hits if h.symptom == "agitação motora"]
    assert len(ag) == 1
    assert ag[0].negated is False


def test_negation_detects_nem_and_tampouco() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele nao e impulsivo; nem perde objetos. Tampouco apresenta estereotipias."
    hits = extract_findings(text, domains, embeddings_provider=None)

    imp = [h for h in hits if h.symptom == "impulsividade"][0]
    po = [h for h in hits if h.symptom == "perda de objetos"][0]
    st = [h for h in hits if h.symptom == "estereotipias motoras"][0]

    assert imp.negated is True
    assert po.negated is True
    assert st.negated is True
