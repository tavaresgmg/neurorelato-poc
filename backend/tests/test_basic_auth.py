from __future__ import annotations

import base64

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import create_app


def _basic(user: str, password: str) -> str:
    token = base64.b64encode(f"{user}:{password}".encode()).decode("ascii")
    return f"Basic {token}"


def test_basic_auth_blocks_by_default_when_configured() -> None:
    old_user = settings.basic_auth_user
    old_pw = settings.basic_auth_password
    settings.basic_auth_user = "demo"
    settings.basic_auth_password = "secret"
    try:
        app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
        with TestClient(app) as client:
            # exempt
            assert client.get("/api/v1/health").status_code == 200

            # protected
            r = client.get("/api/v1/ontology")
            assert r.status_code == 401
            assert "www-authenticate" in {k.lower(): v for k, v in r.headers.items()}

            ok = client.get("/api/v1/ontology", headers={"Authorization": _basic("demo", "secret")})
            assert ok.status_code == 200

            bad = client.get("/api/v1/ontology", headers={"Authorization": _basic("demo", "wrong")})
            assert bad.status_code == 401
    finally:
        settings.basic_auth_user = old_user
        settings.basic_auth_password = old_pw
