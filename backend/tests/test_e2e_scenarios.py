from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient

from app.main import create_app
from app.nlp.anonymize import anonymize_text
from tests.fixtures.narratives import (
    NARRATIVE_ENORMOUS_1,
    NARRATIVE_LONG_1,
    NARRATIVE_LONG_2,
    NARRATIVE_LONG_WITH_PII,
)


def _symptoms_from_response(data: dict[str, Any]) -> set[str]:
    return {f["symptom"] for d in data.get("domains", []) for f in d.get("findings", [])}


def test_e2e_happy_path_multiple_domains_with_negation_and_gaps() -> None:
    """
    Cenário mais realista: múltiplos domínios, negação explícita e gaps.
    """
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    with TestClient(app) as client:
        text = (
            "Mãe relata que ele não olha nos olhos quando falo. "
            "Na escola, fica irritado quando muda a rotina. "
            "Em casa, é muito agitado e não para quieto. "
            "Nega impulsividade."
        )
        r = client.post(
            "/api/v1/normalize",
            json={"text": text, "options": {"enable_embeddings": False}},
        )
        assert r.status_code == 200
        data = r.json()

        # Contract basics
        assert data["request_id"]
        assert data["created_at"]
        assert data["summary"]["generated_by"] == "template"
        assert isinstance(data["summary"]["text"], str) and data["summary"]["text"]

        symptoms = _symptoms_from_response(data)
        assert "contato visual reduzido" in symptoms
        assert "insistência nas mesmas rotinas" in symptoms
        assert "agitação motora" in symptoms
        assert "impulsividade" in symptoms  # encontrada mas negada

        # Negated finding should be marked as negated.
        negated = [
            f for d in data["domains"] for f in d["findings"] if f["symptom"] == "impulsividade"
        ][0]
        assert negated["negated"] is True

        # Gap analysis: with 1 non-negated finding the domain is still "pouco explorado" (medium).
        gaps_by_domain = {g["domain_id"]: g for g in data["gaps"]}
        assert gaps_by_domain["DOM_03"]["gap_level"] in {"medium", "low"}


def test_e2e_anonymization_masks_pii_and_sets_flag() -> None:
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    with TestClient(app) as client:
        text = NARRATIVE_LONG_WITH_PII
        r = client.post(
            "/api/v1/normalize",
            json={
                "text": text,
                "options": {"enable_anonymization": True, "enable_embeddings": False},
            },
        )
        assert r.status_code == 200
        data = r.json()
        assert data["input"]["was_anonymized"] is True
        assert isinstance(data["input"].get("redacted_text"), str)

        # Evidence offsets are based on the processed text (anonymized).
        processed, changed, _hits = anonymize_text(text)
        assert changed is True
        assert data["input"]["redacted_text"] == processed
        all_findings = [f for d in data["domains"] for f in d["findings"]]
        for f in all_findings:
            for ev in f.get("evidence", []):
                start = int(ev["start"])
                end = int(ev["end"])
                assert data["input"]["redacted_text"][start:end].strip() == ev["quote"]


def test_e2e_long_realistic_narrative_produces_multiple_findings_and_summary() -> None:
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    with TestClient(app) as client:
        r = client.post(
            "/api/v1/normalize",
            json={"text": NARRATIVE_LONG_1, "options": {"enable_embeddings": False}},
        )
        assert r.status_code == 200
        data = r.json()

        symptoms = _symptoms_from_response(data)
        # Expect at least one symptom per domain across a longer narrative.
        assert "contato visual reduzido" in symptoms
        assert "insistência nas mesmas rotinas" in symptoms
        assert "sensibilidade sensorial" in symptoms
        assert "agitação motora" in symptoms or "dificuldade de foco" in symptoms

        # Summary should be present and include at least a domain header line.
        assert data["summary"]["generated_by"] == "template"
        assert "Observações por domínio" in data["summary"]["text"]


def test_e2e_repeated_mentions_keep_evidence_list_small_for_legibility() -> None:
    """
    Narrativa longa com repetição do mesmo sintoma deve manter evidências limitadas (top N)
    para não poluir a UI.
    """
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    with TestClient(app) as client:
        r = client.post(
            "/api/v1/normalize",
            json={"text": NARRATIVE_LONG_2, "options": {"enable_embeddings": False}},
        )
        assert r.status_code == 200
        data = r.json()

        all_findings = [f for d in data["domains"] for f in d["findings"]]
        hit = [x for x in all_findings if x["symptom"] == "agitação motora"][0]
        assert hit["method"] in {"heuristic", "embeddings"}
        assert isinstance(hit.get("evidence"), list)
        assert 1 <= len(hit["evidence"]) <= 3


def test_e2e_rejects_too_long_text_with_standard_error_schema() -> None:
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    with TestClient(app) as client:
        r = client.post("/api/v1/normalize", json={"text": "a" * 20001})
        assert r.status_code == 400
        data = r.json()
        assert data["error"]["code"] == "INVALID_INPUT"


def test_e2e_runs_endpoint_invalid_id_returns_400_standard_error_schema() -> None:
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    with TestClient(app) as client:
        r = client.get("/api/v1/runs/not-a-uuid")
        assert r.status_code == 400
        assert r.json()["error"]["code"] == "INVALID_INPUT"


def test_e2e_enormous_narrative_anonymized_offsets_and_expected_findings() -> None:
    """
    Cenário ENORME: valida robustez + fidelidade de evidências (offsets) no texto redigido.
    """
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    with TestClient(app) as client:
        r = client.post(
            "/api/v1/normalize",
            json={
                "text": NARRATIVE_ENORMOUS_1,
                "options": {"enable_anonymization": True, "enable_embeddings": False},
            },
        )
        assert r.status_code == 200
        data = r.json()
        assert data["input"]["was_anonymized"] is True
        redacted = data["input"]["redacted_text"]
        assert isinstance(redacted, str) and len(redacted) > 1000

        symptoms = _symptoms_from_response(data)
        assert "contato visual reduzido" in symptoms
        assert "insistência nas mesmas rotinas" in symptoms
        assert "sensibilidade sensorial" in symptoms
        assert "agitação motora" in symptoms
        assert "dificuldade de foco" in symptoms
        assert "perda de objetos" in symptoms
        assert "impulsividade" in symptoms

        # Evidence fidelity: offsets must match quotes inside the redacted text.
        all_findings = [f for d in data["domains"] for f in d["findings"]]
        for f in all_findings:
            evs = f.get("evidence") or []
            assert len(evs) <= 3
            for ev in evs:
                s = int(ev["start"])
                e = int(ev["end"])
                assert redacted[s:e].strip() == ev["quote"]
