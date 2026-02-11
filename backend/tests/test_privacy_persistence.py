from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.db.models import ConsultationRun
from app.main import create_app


def test_persists_redacted_text_when_pii_is_detected() -> None:
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    SessionLocal = app.state.SessionLocal
    with TestClient(app) as client:
        r = client.post(
            "/api/v1/normalize",
            json={
                "text": (
                    "Paciente João tem 7 anos. Data 10/02/2026. Email joao@example.com. "
                    "CPF 123.456.789-10."
                ),
                "options": {"enable_embeddings": False},
            },
        )
        assert r.status_code == 200
        run_id = uuid.UUID(r.json()["request_id"])

        with SessionLocal() as db:
            run = db.get(ConsultationRun, run_id)
            assert run is not None
            assert run.text_redacted is not None
            assert "[PACIENTE]" in run.text_redacted or "Paciente" in run.text_redacted
            assert "[EMAIL]" in run.text_redacted
            assert "[CPF]" in run.text_redacted
            assert "[DATA]" in run.text_redacted


def test_does_not_persist_redacted_text_when_no_pii_is_detected() -> None:
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    SessionLocal = app.state.SessionLocal
    with TestClient(app) as client:
        r = client.post(
            "/api/v1/normalize",
            json={"text": "Relato sem PII, apenas sintomas: não olha nos olhos e evita interação."},
        )
        assert r.status_code == 200
        run_id = uuid.UUID(r.json()["request_id"])

        with SessionLocal() as db:
            run = db.get(ConsultationRun, run_id)
            assert run is not None
            assert run.text_redacted is None
