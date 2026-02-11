from __future__ import annotations

from app.nlp.embeddings import EmbeddingProvider, extract_findings_embeddings
from app.nlp.ontology import MOCK_ONTOLOGY, load_domains


class FakeProvider(EmbeddingProvider):
    def embed(self, texts: list[str]) -> list[list[float]]:
        # Deterministic vectors so we don't download models in tests.
        out: list[list[float]] = []
        for t in texts:
            if "dificuldade de foco" in t:
                out.append([1.0, 0.0])
            elif "nega dificuldade de foco" in t.lower():
                out.append([0.95, 0.05])
            elif "dispersa" in t.lower():
                out.append([0.9, 0.1])
            elif "manter a atenção" in t:
                out.append([0.9, 0.1])
            elif "frase ambigua A" in t:
                out.append([0.50, 0.50])
            elif "frase ambigua B" in t:
                out.append([0.49, 0.51])
            else:
                out.append([0.0, 1.0])
        return out


def test_embeddings_fallback_maps_sentence_to_symptom_and_returns_offsets() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele tem dificuldade para manter a atenção. Outra frase."

    hits = extract_findings_embeddings(
        text,
        domains,
        already_found=set(),
        provider=FakeProvider(),
        threshold=0.5,
    )

    sym = {h.symptom for h in hits}
    assert "dificuldade de foco" in sym

    h = [x for x in hits if x.symptom == "dificuldade de foco"][0]
    assert h.method == "embeddings"
    assert h.evidence
    assert "manter a atenção" in h.evidence[0].quote
    assert h.evidence[0].start >= 0
    assert h.evidence[0].end > h.evidence[0].start


def test_embeddings_marks_negated_when_sentence_contains_negator() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele não tem dificuldade para manter a atenção."

    hits = extract_findings_embeddings(
        text,
        domains,
        already_found=set(),
        provider=FakeProvider(),
        threshold=0.5,
    )

    h = [x for x in hits if x.symptom == "dificuldade de foco"][0]
    assert h.negated is True


def test_embeddings_marks_negated_when_sentence_contains_nega() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Nega dificuldade de foco. Ele tem dificuldade para manter a atenção."

    hits = extract_findings_embeddings(
        text,
        domains,
        already_found=set(),
        provider=FakeProvider(),
        threshold=0.5,
    )

    h = [x for x in hits if x.symptom == "dificuldade de foco"][0]
    assert h.negated is True


def test_embeddings_does_not_mark_negated_for_not_only_construction() -> None:
    """
    "Não só ... como também ..." não é negação do achado (equivale a "não apenas").
    """
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele não só tem dificuldade para manter a atenção como também perde o foco rapidamente."

    hits = extract_findings_embeddings(
        text,
        domains,
        already_found=set(),
        provider=FakeProvider(),
        threshold=0.5,
    )

    h = [x for x in hits if x.symptom == "dificuldade de foco"][0]
    assert h.negated is False


def test_embeddings_marks_negated_for_nem() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele nem tem dificuldade para manter a atenção."

    hits = extract_findings_embeddings(
        text,
        domains,
        already_found=set(),
        provider=FakeProvider(),
        threshold=0.5,
    )

    h = [x for x in hits if x.symptom == "dificuldade de foco"][0]
    assert h.negated is True


def test_embeddings_margin_filter_rejects_ambiguous_match() -> None:
    """
    Quando duas sentencas competem com scores muito proximos e o score nao e "forte",
    a PoC rejeita para reduzir falso positivo.
    """
    domains = load_domains(MOCK_ONTOLOGY)
    text = "frase ambigua A. frase ambigua B."

    hits = extract_findings_embeddings(
        text,
        domains,
        already_found=set(),
        provider=FakeProvider(),
        threshold=0.62,
        strong_threshold=0.78,
        margin=0.04,
    )

    assert "dificuldade de foco" not in {h.symptom for h in hits}


def test_embeddings_negation_ignores_negator_before_contrastive_mas() -> None:
    domains = load_domains(MOCK_ONTOLOGY)
    text = "Ele não é muito agitado, mas se dispersa com facilidade durante tarefas longas."

    hits = extract_findings_embeddings(
        text,
        domains,
        already_found=set(),
        provider=FakeProvider(),
        threshold=0.5,
    )

    h = [x for x in hits if x.symptom == "dificuldade de foco"][0]
    assert h.negated is False
