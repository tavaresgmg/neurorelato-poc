from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


def test_request_validation_error_does_not_echo_input_value() -> None:
    """
    LGPD: Pydantic/FastAPI validation errors often include an `input` field with the raw value.
    Our API must not return raw inputs (narrativa clínica) in error details.
    """
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    with TestClient(app) as client:
        payload = {"text": "a" * 20001}  # triggers max_length validation
        r = client.post("/api/v1/normalize", json=payload)
        assert r.status_code == 400
        data = r.json()
        assert data["error"]["code"] == "INVALID_INPUT"
        errors = data["error"]["details"]["validation_errors"]
        assert isinstance(errors, list) and errors
        # No raw `input` should be returned.
        assert all("input" not in e for e in errors)
        assert all("ctx" not in e for e in errors)
