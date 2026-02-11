# NeuroRelato (PoC)

PoC de normalizacao semantica para transformar narrativa clinica livre em dado estruturado com evidencias e lacunas informacionais. Nao diagnostica.

## Entrega em 1 minuto

- API principal: `POST /api/v1/normalize`.
- Saida estruturada por dominio/sintoma com evidencias e offsets (XAI).
- Gap analysis com perguntas sugeridas.
- Persistencia em Postgres com historico (`GET /api/v1/history`, `GET /api/v1/runs/{id}`).
- Anonimizacao sempre ativa no backend antes de processar/persistir.
- Embeddings locais (sem LLM) com fallback para heuristicas.

## Atendimento ao Edital

### Essencial

| Item                                             | Status   | Evidencia                                                                                                   |
| ------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| Backend API para texto bruto -> dado estruturado | Atendido | `POST /api/v1/normalize`, `backend/app/api/v1/routes.py`                                                    |
| Extracao de entidades para ontologia alvo        | Atendido | `backend/app/nlp/engine.py`, `backend/app/nlp/ontology.py`                                                  |
| Frontend funcional para uso medico               | Atendido | `frontend/src/App.tsx`, `frontend/src/components/InputPanel.tsx`, `frontend/src/components/OutputPanel.tsx` |
| Qualidade de codigo (componentizacao/separacao)  | Atendido | backend modular (`app/api`, `app/nlp`, `app/db`), frontend componentizado (`frontend/src/components`)       |

### Desejavel

| Item                                  | Status   | Evidencia                                                                              |
| ------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| Gap analysis por dominio              | Atendido | `compute_gaps` em `backend/app/nlp/engine.py`, `frontend/src/components/GapsPanel.tsx` |
| Resumo tecnico estilo prontuario      | Atendido | `backend/app/nlp/summary.py` (`generated_by=template`)                                 |
| Similaridade semantica com embeddings | Atendido | `backend/app/nlp/embeddings.py`                                                        |
| Persistencia/historico em banco       | Atendido | `backend/app/db/models.py`, `GET /api/v1/history`, `GET /api/v1/runs/{id}`             |

### Plus

| Item                                               | Status   | Evidencia                                                                              |
| -------------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| Pipeline de anonimização antes de processar/salvar | Atendido | `backend/app/nlp/anonymize.py`, `backend/app/api/v1/routes.py`                         |
| Explainable AI (trechos + offsets)                 | Atendido | campo `evidence` + `frontend/src/components/EvidenceModal.tsx`                         |
| Interface por audio                                | Atendido | `frontend/src/hooks/useSpeechRecognition.ts`, `frontend/src/components/VoiceInput.tsx` |

## Como Rodar

### Docker (recomendado)

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173` (ou `PN_FRONTEND_PORT`)
- Backend health: `http://localhost:8000/api/v1/health` (ou `PN_BACKEND_PORT`)
- Swagger: `http://localhost:8000/docs` (alternativo: `http://localhost:8000/redoc`)

Se precisar trocar portas:

```bash
PN_FRONTEND_PORT=5174 PN_BACKEND_PORT=8001 PN_DB_PORT=5433 docker compose up --build
```

### Local (sem Docker)

Backend:

```bash
cd backend
uv sync --frozen --group dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

## Testes e Qualidade

Backend:

```bash
cd backend
uv run ruff check .
uv run python -m mypy app
uv run python -m pytest --cov=app
```

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm run test:coverage
```

Cobertura:

- Backend: cobertura atual 94% (ultima validacao local em 2026-02-11), com gate no CI de no minimo 90% (`--cov-fail-under=90`).
- Frontend: cobertura atual 91.26% statements (ultima validacao local em 2026-02-11).

Benchmark offline (opcional):

```bash
cd backend
uv run python tools/benchmark.py --runs 20
```

## Demo e Observabilidade

### Demo (Heroku)

- App: `https://neurorelatopoc-60b95d8f43fd.herokuapp.com/`
- API health: `https://neurorelatopoc-60b95d8f43fd.herokuapp.com/api/v1/health`
- Swagger: `https://neurorelatopoc-60b95d8f43fd.herokuapp.com/docs`
- OpenAPI JSON: `https://neurorelatopoc-60b95d8f43fd.herokuapp.com/openapi.json`

### Observabilidade

Local:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (credenciais no arquivo local `ACESSOS_PRIVADOS.txt`)
- Backend metrics: `http://localhost:8000/metrics`

Remoto:

- Métricas backend: `https://neurorelatopoc-60b95d8f43fd.herokuapp.com/metrics`
- Prometheus: `https://neurorelatopoc-prometheus-964f3fe83c44.herokuapp.com/`
  - health: `https://neurorelatopoc-prometheus-964f3fe83c44.herokuapp.com/-/healthy`
  - targets: `https://neurorelatopoc-prometheus-964f3fe83c44.herokuapp.com/api/v1/targets?state=active`
- Grafana: `https://neurorelatopoc-grafana-8bea103e0dbd.herokuapp.com/` (credenciais no arquivo local `ACESSOS_PRIVADOS.txt`)
- Dashboard: `https://neurorelatopoc-grafana-8bea103e0dbd.herokuapp.com/d/neurorelato-observability/neurorelato-observabilidade-poc?orgId=1&from=now-30m&to=now&timezone=browser&refresh=10s`
- Troubleshooting rapido: se o Grafana mostrar "No data", valide os targets do Prometheus e as vars `PN_METRICS_BASIC_AUTH_*` no app `neurorelatopoc-prometheus`.

## Limitações Conhecidas

- Audio depende da Web Speech API do navegador; sem suporte, o botão de ditado fica desabilitado (sem fallback local).
- Compatibilidade de audio nesta PoC: Chrome (desktop/Android), Edge (Chromium), Safari (macOS/iOS) e derivados Chromium (pode variar por permissao/politica).
- Anonimizacao é heuristica; reduz risco, mas nao garante 100% de acerto para nomes.
- Negacao/temporalidade usa heuristicas simples.
- Primeiro uso de embeddings pode ter latencia maior por inicializacao/download.
- A API remove `input` de erros de validacao e nao persiste texto bruto.
