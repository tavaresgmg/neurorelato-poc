# Backend (FastAPI)

API de normalizacao semantica (narrativa -> achados/lacunas/evidencias) com persistencia em Postgres.

## Rodar

### Docker Compose

Na raiz do repo:

```bash
docker compose up --build
```

- Health: `http://localhost:8000/api/v1/health`

### Local

```bash
cd backend
uv sync --frozen --group dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

## Testes e Qualidade

```bash
cd backend
uv run ruff check .
uv run python -m mypy app
uv run pytest --cov=app
```

## Variáveis de Ambiente

- `PN_DATABASE_URL` (ou `DATABASE_URL` no Heroku)
- `PN_BASIC_AUTH_USER`
- `PN_BASIC_AUTH_PASSWORD`
- `PN_ENABLE_EMBEDDINGS_BY_DEFAULT=true|false`
- `PN_EMBEDDINGS_WARMUP=true|false`
- `PN_EMBEDDINGS_MODEL` (default: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`)

## Observabilidade

- Endpoint Prometheus: `GET /metrics`
- Métricas de pipeline (`pn_*`) e HTTP
- Labels sem PII
