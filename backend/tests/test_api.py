from __future__ import annotations

from typing import NoReturn

from fastapi.testclient import TestClient
from pytest import MonkeyPatch

from app.main import create_app


def test_health_ok() -> None:
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.get("/api/v1/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}


def test_every_response_has_request_id_header() -> None:
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.get("/api/v1/health")
        assert r.status_code == 200
        assert r.headers.get("X-Request-ID")


def test_request_id_is_echoed_when_provided() -> None:
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.get("/api/v1/health", headers={"X-Request-ID": "req-test-123"})
        assert r.status_code == 200
        assert r.headers.get("X-Request-ID") == "req-test-123"


def test_normalize_contract_minimal() -> None:
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.post(
            "/api/v1/normalize",
            json={"text": "texto de teste", "options": {"enable_anonymization": False}},
        )
        assert r.status_code == 200
        data = r.json()
        assert "request_id" in data
        assert "created_at" in data
        assert "domains" in data
        assert isinstance(data["domains"], list)
        assert data["input"]["was_anonymized"] is False
        assert "redacted_text" not in data["input"]


def test_normalize_rejects_empty_text_with_standard_error_schema() -> None:
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.post("/api/v1/normalize", json={"text": ""})
        assert r.status_code == 400
        data = r.json()
        assert "error" in data
        assert data["error"]["code"] == "INVALID_INPUT"


def test_normalize_rejects_whitespace_only_text_with_standard_error_schema() -> None:
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.post("/api/v1/normalize", json={"text": "   \n\t  "})
        assert r.status_code == 400
        assert r.json()["error"]["code"] == "INVALID_INPUT"


def test_history_returns_items() -> None:
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        # create two runs
        assert client.post("/api/v1/normalize", json={"text": "a"}).status_code == 200
        assert client.post("/api/v1/normalize", json={"text": "b"}).status_code == 200

        r = client.get("/api/v1/history?limit=10")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 2
        assert data[0]["request_id"]


def test_get_run_returns_persisted_result() -> None:
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.post(
            "/api/v1/normalize",
            json={"text": "Ele não olha nos olhos quando falo. Muito agitado, não para quieto."},
        )
        assert r.status_code == 200
        run_id = r.json()["request_id"]

        get_r = client.get(f"/api/v1/runs/{run_id}")
        assert get_r.status_code == 200
        data = get_r.json()
        assert data["request_id"] == run_id
        assert isinstance(data["domains"], list)
        assert any(d["findings"] for d in data["domains"])


def test_get_run_404_for_unknown_id() -> None:
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.get("/api/v1/runs/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404
        assert r.json()["error"]["code"] == "NOT_FOUND"


def test_normalize_extracts_findings_and_gaps() -> None:
    app = create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)
    with TestClient(app) as client:
        r = client.post(
            "/api/v1/normalize",
            json={"text": "Ele não olha nos olhos quando falo. Muito agitado, não para quieto."},
        )
        assert r.status_code == 200
        data = r.json()
        all_findings = [f for d in data["domains"] for f in d["findings"]]
        symptoms = {f["symptom"] for f in all_findings}
        assert "contato visual reduzido" in symptoms
        assert "agitação motora" in symptoms

        # should suggest at least one gap (domains not covered)
        assert isinstance(data["gaps"], list)


def test_force_anonymization_overrides_client_option(monkeypatch: MonkeyPatch) -> None:
    """
    Em demo hospedada, podemos forçar anonimização no backend por policy (sem confiar no cliente).
    """
    from app.api.v1 import routes

    monkeypatch.setattr(routes.settings, "force_anonymization", True)
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.post(
            "/api/v1/normalize",
            json={
                "text": "Contato: joao@example.com. Meu filho Joao tem 7 anos.",
                "options": {"enable_anonymization": False, "enable_embeddings": False},
            },
        )
        assert r.status_code == 200
        data = r.json()
        assert data["input"]["was_anonymized"] is True
        assert "[EMAIL]" in data["input"]["redacted_text"]


def test_enable_embeddings_by_default_warns_and_falls_back_when_unavailable(
    monkeypatch: MonkeyPatch,
) -> None:
    """
    Quando embeddings estão habilitados por policy e o provider falha, a API deve:
    - retornar 200
    - incluir warning EMBEDDINGS_UNAVAILABLE
    - seguir com heurísticas (não 500)
    """
    from app.api.v1 import routes

    monkeypatch.setattr(routes.settings, "enable_embeddings_by_default", True)

    def _boom() -> NoReturn:
        raise RuntimeError("no provider")

    monkeypatch.setattr(routes, "get_default_provider", _boom)

    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.post(
            "/api/v1/normalize",
            json={
                "text": "Ele não olha nos olhos quando falo. Muito agitado, não para quieto.",
                "options": {"enable_anonymization": False, "enable_embeddings": False},
            },
        )
        assert r.status_code == 200
        data = r.json()
        codes = {w["code"] for w in data.get("warnings", [])}
        assert "EMBEDDINGS_UNAVAILABLE" in codes


def test_enable_embeddings_by_default_extracts_embeddings_findings_even_if_client_disables(
    monkeypatch: MonkeyPatch,
) -> None:
    """
    Garante fidelidade do consumo: quando policy liga embeddings por default, o backend usa
    embeddings mesmo que o cliente envie enable_embeddings=false.
    """
    from app.api.v1 import routes
    from app.nlp.embeddings import EmbeddingProvider

    class FakeProvider(EmbeddingProvider):
        def embed(self, texts: list[str]) -> list[list[float]]:
            out: list[list[float]] = []
            for t in texts:
                if "dificuldade de foco" in t:
                    out.append([1.0, 0.0])
                elif "dispersa" in t:
                    out.append([0.9, 0.1])
                else:
                    out.append([0.0, 1.0])
            return out

    monkeypatch.setattr(routes.settings, "enable_embeddings_by_default", True)
    monkeypatch.setattr(routes, "get_default_provider", lambda: FakeProvider())

    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.post(
            "/api/v1/normalize",
            json={
                "text": "Na escola, ele se dispersa com facilidade durante tarefas longas.",
                "options": {"enable_embeddings": False, "enable_anonymization": False},
            },
        )
        assert r.status_code == 200
        data = r.json()
        all_findings = [f for d in data["domains"] for f in d["findings"]]
        df = [f for f in all_findings if f["symptom"] == "dificuldade de foco"][0]
        assert df["method"] == "embeddings"


def test_embeddings_runtime_error_adds_warning_and_falls_back(monkeypatch: MonkeyPatch) -> None:
    """
    Robustez operacional: se o provider existir mas falhar no embed() (download/model runtime),
    a API deve retornar 200 e emitir warning (sem 500).
    """
    from app.api.v1 import routes
    from app.nlp.embeddings import EmbeddingProvider

    class BoomProvider(EmbeddingProvider):
        def embed(self, texts: list[str]) -> list[list[float]]:
            raise RuntimeError("boom")

    monkeypatch.setattr(routes, "get_default_provider", lambda: BoomProvider())
    with TestClient(create_app(database_url="sqlite+pysqlite:///:memory:", init_db=True)) as client:
        r = client.post(
            "/api/v1/normalize",
            json={
                "text": "Ele não olha nos olhos quando falo. Muito agitado, não para quieto.",
                "options": {"enable_embeddings": True, "enable_anonymization": False},
            },
        )
        assert r.status_code == 200
        data = r.json()
        codes = {w["code"] for w in data.get("warnings", [])}
        assert "EMBEDDINGS_RUNTIME_ERROR" in codes
