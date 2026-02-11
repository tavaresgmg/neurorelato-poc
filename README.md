# NeuroRelato (PoC)

PoC para **normalizacao semantica**: transformar narrativa clinica livre em **dados estruturados** (por dominio/sintoma), com **evidencias** (rastreabilidade) e **lacunas informacionais** (perguntas sugeridas). **Nao diagnostica**.

## Atalhos

- Trade-offs e decisoes: `NOTAS_AVALIADOR.md`
- README backend: `backend/README.md`
- README frontend: `frontend/README.md`

## Demo (Heroku)

App: `https://cryptic-bastion-29267-5dfa44aa7e7a.herokuapp.com/`
API health: `https://cryptic-bastion-29267-5dfa44aa7e7a.herokuapp.com/api/v1/health`
Swagger (OpenAPI): `https://cryptic-bastion-29267-5dfa44aa7e7a.herokuapp.com/docs`

## Como rodar

### Dev (Docker)

```bash
docker compose up --build
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8000/api/v1/health`
Swagger (OpenAPI): `http://localhost:8000/docs` (alternativo: `http://localhost:8000/redoc`)

Obs: o backend executa `alembic upgrade head` no startup (dev) para manter o schema do Postgres atualizado.

Se alguma porta estiver ocupada, use overrides:

```bash
PN_FRONTEND_PORT=5174 PN_BACKEND_PORT=8001 PN_DB_PORT=5433 docker compose up --build
```

### Testes e qualidade

Backend:

```bash
cd backend
uv sync --frozen --group dev
uv run ruff check .
uv run mypy .
uv run pytest --cov=app
```

Benchmark (opcional, offline; gera baseline simples de acuracia/latencia):

```bash
cd backend
uv run python tools/benchmark.py --runs 20
```

Frontend:

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run test:coverage
```

### Demo (Basic Auth)

Defina `PN_BASIC_AUTH_USER` e `PN_BASIC_AUTH_PASSWORD` (Heroku Config Vars) para exigir autenticação básica no app.

Privacidade (demo):

- `PN_FORCE_ANONYMIZATION=true` força anonimização no backend (no `docker-compose.yml`, este e o default).
- `PN_ENABLE_EMBEDDINGS_BY_DEFAULT=true` liga embeddings por default (no `docker-compose.yml`, este e o default; o primeiro uso pode baixar o modelo).
- `PN_EMBEDDINGS_WARMUP=true` tenta aquecer embeddings no startup (background) para reduzir latência do primeiro request.

LGPD (importante):

- A API não retorna valores brutos de input em erros de validação (evita vazar narrativa clínica em `details`).
- O backend não persiste texto bruto; persiste apenas `text_redacted` quando a anonimização está ativa.
