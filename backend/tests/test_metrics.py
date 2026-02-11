from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


def test_metrics_endpoint_exposed() -> None:
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    with TestClient(app) as client:
        r = client.get("/metrics")
        assert r.status_code == 200
        # Endpoint should return Prometheus exposition format.
        assert "text/plain" in r.headers.get("content-type", "")
        body = r.text
        # Custom PoC metrics must exist (even if zero).
        assert "pn_normalize_seconds" in body
        assert "pn_embeddings_runtime_error_total" in body
