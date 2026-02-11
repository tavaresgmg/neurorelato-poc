# Notas Para Avaliador (Trade-offs e Decisoes)

Este arquivo existe para deixar claro **o por quê** das escolhas desta PoC e quais seriam
os proximos passos em um produto real.

## O Que Foi Entregue (mapeado ao desafio)

Essencial:

- Backend API: `POST /api/v1/normalize` recebe texto e devolve dado estruturado.
- Extracao de entidades: mapeia frases livres para sintomas alvo (ex: "nao olha nos olhos" -> "contato visual reduzido").
- Frontend funcional: UI para inserir texto, processar, ver dominios/achados/lacunas e abrir evidencias.
- Qualidade: separacao por modulos no backend, componentizacao no frontend, testes e CI.

Desejavel:

- Gap analysis: retorna dominios pouco explorados com perguntas sugeridas.
- Resumo tecnico: template (sem LLM).
- Embeddings: similaridade semantica local (opcional) com fallback.
- Persistencia: Postgres + historico (`GET /api/v1/history`, `GET /api/v1/runs/{id}`).

Plus:

- Anonimizacao: mascara email/telefone/CPF, datas comuns (dd/mm/aaaa) e heuristica de nome (PoC).
- XAI: evidencias com trechos + offsets; UI mostra contexto e texto processado quando anonimizado.
- Audio: ditado via Web Speech API (dependente do navegador).

## Demo (Heroku)

- App: `https://cryptic-bastion-29267-5dfa44aa7e7a.herokuapp.com/`
- Swagger: `https://cryptic-bastion-29267-5dfa44aa7e7a.herokuapp.com/docs`
  - Obs: usa Heroku Postgres `essential-0` (max $5/mes).

## Trade-offs Principais

1. Sem LLM (por default)

- Motivo: privacidade/LGPD e confiabilidade operacional (PoC precisa rodar local e em container).
- Consequencia: resumo tecnico e gap analysis sao deterministas (template), menos "human-like".

2. Heuristica + embeddings (hibrido)

- Motivo: heuristica e mais previsivel e tende a ter melhor precisao para frases bem conhecidas;
  embeddings aumenta recall para variacoes/para frases nao previstas.
- Consequencia: embeddings pode aumentar falso positivo. Por isso existe filtro conservador
  (threshold + margem vs segundo melhor candidato).
- Robustez: se embeddings falharem em runtime (download/modelo), a API emite warning e cai para heuristicas (sem 500).

3. Persistir apenas texto redigido (quando anonimizado)

- Motivo: permitir auditoria de offsets (XAI) sem reter texto bruto com PII.
- Decisao: a UI mantem anonimização **sempre ativa** (sem toggle) para reduzir risco de uso indevido e
  garantir rastreabilidade (offsets) sem expor PII.
- Consequencia: a API nao expõe toggle de anonimização; o pipeline roda sempre antes de processar/persistir
  (requisito "Plus" do desafio). Campos antigos como `enable_anonymization` sao ignorados.

4. Monolito modular na PoC

- Motivo: prazo curto e simplicidade para entregar ponta a ponta (API + UI + DB + testes).
- Consequencia: em produto real, o motor NLP/IA tende a virar servico separado.

## Bibliotecas de NLP/IA (e por que)

- `fastembed` (ONNX): embeddings locais em CPU com foco em simplicidade operacional em container.
  Alternativa mais "padrao de mercado" para pesquisa/prototipos: `sentence-transformers` (mais pesado).
- Heuristica: normalizacao (lowercase/diacriticos) + patterns e regras. Para produto real,
  eu consideraria `spaCy` (matcher/pipeline) e/ou um modelo com reranking (cross-encoder) para reduzir falso positivo.

## O Que Eu Faria Diferente Em Produto Real

- Separar servicos: `api` (cadastro/historico/auth) vs `nlp` (pipeline e modelos).
- Pipeline NLP mais robusto:
  - normalizacao por entidades/regex + rules (ex: spaCy matcher) com camada de negacao/temporalidade
  - embeddings + rerank (cross-encoder) para reduzir falso positivo
  - avaliacao offline (dataset rotulado) com metricas (precision/recall por sintoma)
- Privacidade:
  - criptografia em repouso, rotacao de chaves, retention policy
  - trilha de auditoria e segregacao de ambientes
- Observabilidade:
  - logs estruturados sem PII, metricas (latencia/erros), tracing
  - correlacao por `X-Request-ID` (esta PoC ja retorna esse header)
- Ontologia:
  - versionamento formal, migracoes e curadoria (nao "hardcode" no codigo)

## Limitacoes Conhecidas (PoC)

- Negaçao/temporalidade: heuristicas simples (nao cobre todos os casos clinicos).
- Anonimizacao: demonstrativa, nao garante 100% de acerto para nomes.
- Embeddings: primeiro uso pode ter custo de download de pesos (mitigavel com warmup / imagem prebuild).
- Erros de validacao: a API remove o campo `input` dos detalhes de validacao para nao vazar narrativa clinica.
- Guardrail de logs: existe um filtro best-effort para redigir PII comum (email/CPF/telefone) em mensagens de log.
- Observabilidade: todas as respostas incluem header `X-Request-ID` para correlacao (sem PII).

## Verified by (local)

- Backend: `uv run ruff check .`, `uv run mypy .`, `uv run pytest --cov=app` (coverage total ~94%).
- Benchmark: `uv run python tools/benchmark.py --format json --runs 20` (golden dataset).
  - embeddings off: `macro_f1=1.00` (latencia tipica sub-ms; depende da maquina)
  - embeddings on (warmup): `macro_f1=1.00` (latencia tipica dezenas de ms; outliers podem ocorrer em CPU)
- Stress test: narrativa grande com PII ficticio + repeticoes/nuances (anonimizacao + offsets) coberta por teste E2E.
- LGPD: suite inclui testes que garantem:
  - erros de validacao nao ecoam `input`
  - texto bruto nao e persistido quando anonimização esta desligada
