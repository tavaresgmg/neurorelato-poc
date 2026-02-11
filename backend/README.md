# Backend (FastAPI)

API de normalizacao semantica (narrativa -> achados/lacunas/evidencias) + persistencia em Postgres.

## Rodar (Docker Compose)

Na raiz do repo:

```bash
docker compose up --build
```

Backend: `http://localhost:8000/api/v1/health`
Swagger (OpenAPI): `http://localhost:8000/docs` (alternativo: `http://localhost:8000/redoc`)

## Rodar (local)

```bash
cd backend
uv sync --frozen --group dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

## Testes e qualidade

```bash
cd backend
uv run ruff check .
uv run mypy .
uv run pytest --cov=app
```

## Benchmark (PoC)

Script simples (nao roda no CI) para medir latencia e um conjunto pequeno de cenarios "golden":

```bash
cd backend
uv run python tools/benchmark.py --runs 20
uv run python tools/benchmark.py --embeddings --warmup --runs 10
```

Export JSON:

```bash
cd backend
uv run python tools/benchmark.py --format json --runs 20 --out /tmp/plataformaneuro_benchmark.json
```

## Variaveis de ambiente

- `PN_DATABASE_URL` (ou `DATABASE_URL` no Heroku)
- Demo (Basic Auth):
  - `PN_BASIC_AUTH_USER`
  - `PN_BASIC_AUTH_PASSWORD`
- Policies (server-side):
  - Anonimização roda sempre (antes de processar/persistir).
  - `PN_ENABLE_EMBEDDINGS_BY_DEFAULT=true|false`
  - `PN_EMBEDDINGS_WARMUP=true|false`
  - `PN_EMBEDDINGS_MODEL` (default: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`)

## Robustez (embeddings)

- Se embeddings forem habilitados e falharem em runtime (download/modelo/onnxruntime), a API retorna `200`
  e inclui warning `EMBEDDINGS_RUNTIME_ERROR`, caindo para heurísticas (sem 500).
