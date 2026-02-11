# NeuroRelato (PoC)

PoC de **normalizacao semantica**: transformar narrativa clinica livre em **dados estruturados**
(por dominio/sintoma), com **evidencias** (rastreabilidade) e **lacunas informacionais**
(perguntas sugeridas). **Nao diagnostica**.

## Atalhos

- Trade-offs, decisoes e "o que eu faria diferente": `NOTAS_AVALIADOR.md`
- README backend: `backend/README.md`
- README frontend: `frontend/README.md`

## O Que Esta PoC Entrega (mapa rapido do desafio)

- API: `POST /api/v1/normalize` (extrai achados por dominio/sintoma + gaps + resumo tecnico).
- XAI: para cada achado, retorna evidencias (trechos) + offsets.
- Gap analysis: identifica dominios pouco explorados e sugere perguntas.
- Embeddings (sem LLM): similaridade semantica local (CPU) como fallback, com filtros conservadores.
- Persistencia: Postgres + historico (`GET /api/v1/history`, `GET /api/v1/runs/{id}`).
- LGPD (Plus): anonimiza no backend **antes** de processar e persistir (sem depender de toggle no frontend).
- Audio (Plus): ditado via Web Speech API (dependente do navegador).

## Como rodar

### Dev (Docker)

```bash
docker compose up --build
```

Frontend: `http://localhost:5173` (ou `PN_FRONTEND_PORT`)
Backend health: `http://localhost:8000/api/v1/health` (ou `PN_BACKEND_PORT`)
Swagger (OpenAPI): `http://localhost:8000/docs` (alternativo: `http://localhost:8000/redoc`)
O backend executa `alembic upgrade head` no startup (dev) para manter o schema do Postgres atualizado.

Se alguma porta estiver ocupada, use overrides:

```bash
PN_FRONTEND_PORT=5174 PN_BACKEND_PORT=8001 PN_DB_PORT=5433 docker compose up --build
```

### Observabilidade (Prometheus + Grafana)

Ao subir via `docker compose`, os serviços de observabilidade também sobem:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`
  - login: `admin`
  - senha: `admin`
- Métricas do backend: `http://localhost:8000/metrics`

Remoto (Heroku): `https://neurorelatopoc-60b95d8f43fd.herokuapp.com/metrics`

O endpoint `/metrics` não inclui PII em labels. Se o Basic Auth estiver habilitado, `/metrics` exige autenticação.

Dashboard (Grafana):

- `NeuroRelato - Observabilidade (PoC)` (já provisionado)
  - URL: `http://localhost:3000/d/neurorelato-observability/neurorelato-observabilidade-poc`

## Demo (Heroku)

- App: `https://neurorelatopoc-60b95d8f43fd.herokuapp.com/`
- API health: `https://neurorelatopoc-60b95d8f43fd.herokuapp.com/api/v1/health`
- Swagger (OpenAPI): `https://neurorelatopoc-60b95d8f43fd.herokuapp.com/docs`
- OpenAPI JSON: `https://neurorelatopoc-60b95d8f43fd.herokuapp.com/openapi.json`

### Como testar online (rapido)

1. Abra o app (link acima)
2. Cole um relato em **Entrada**
3. Clique em **Processar**
4. Valide:
   - achados por dominio/sintoma
   - lacunas (perguntas sugeridas)
   - evidencias (trechos e offsets; rastreabilidade)

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

### Demo (Basic Auth, opcional)

Defina `PN_BASIC_AUTH_USER` e `PN_BASIC_AUTH_PASSWORD` (Heroku Config Vars) para exigir autenticação básica no app.

Privacidade (demo):

- A anonimização roda sempre no backend (sem depender de toggle do cliente).
- `PN_ENABLE_EMBEDDINGS_BY_DEFAULT=true` liga embeddings por default (o primeiro uso pode baixar o modelo).
- `PN_EMBEDDINGS_WARMUP=true` tenta aquecer embeddings no startup (background) para reduzir latência do primeiro request.

LGPD (importante):

- A API não retorna valores brutos de input em erros de validação (evita vazar narrativa clínica em `details`).
- O backend não persiste texto bruto; persiste apenas `text_redacted` quando a anonimização está ativa.
