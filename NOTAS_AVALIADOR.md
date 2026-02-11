# Notas Para Avaliador

## Trade-offs Principais

1. Sem LLM por default

- Motivo: reduzir risco de privacidade e aumentar previsibilidade operacional.
- Efeito: resumo e gap analysis ficam deterministas (template), menos "human-like".

2. Heuristica + embeddings (hibrido)

- Motivo: heuristica da previsibilidade; embeddings aumenta recall em variacoes linguisticas.
- Efeito: risco de falso positivo mitigado por threshold, margem e guardrails.
- Robustez: falha de embeddings gera warning e fallback para heuristicas (sem 500).

3. Persistencia focada em privacidade

- Motivo: permitir auditoria de evidencias/offsets sem reter texto bruto com PII.
- Decisao: persistir apenas `text_redacted` quando anonimizado.
- Consequencia: anonimização sempre ativa no backend; sem toggle publico.

4. Monolito modular na PoC

- Motivo: prazo curto e menor risco para entrega ponta a ponta.
- Consequencia: em produto real, a arquitetura tende a ser decomposta, pelo menos, nos servicos `FRONT`, `API`, `IA` e `DB`.

## Decisões Técnicas de NLP/IA

- Embeddings: `fastembed` (ONNX), local em CPU, sem dependencia de servico externo.
- Extração base: normalizacao + patterns + negacao em pt-BR para explicabilidade.
- Guardrails semanticos: filtros de meta-texto, contexto e ancoras lexicais por sintoma.
- Sem treino de modelo nesta PoC: nao ha dataset rotulado fornecido para avaliar ganho com rigor.
- Audio: interface usa Web Speech API; sem fallback local nesta versao.

## Limitações e Riscos

- Negaçao/temporalidade ainda limitada para casos clinicos complexos.
- Anonimizacao de nomes é heuristica (nao perfeita).
- Primeiro uso de embeddings pode elevar latencia.
- Logs usam redacao best-effort de PII comum.
- Demo por URL publica requer controle operacional (Basic Auth).

## O que eu faria em produto real

- Separar claramente os blocos da plataforma:
  - `FRONT`: interface web e experiência de uso.
  - `API`: autenticação, contratos, orquestração e histórico.
  - `IA`: pipeline NLP/embeddings/modelos e regras clínicas.
  - `DB`: persistência, retenção, auditoria e políticas de acesso.
- Evoluir pipeline com NER/rules + rerank (cross-encoder) e avaliacao offline por sintoma.
- Adicionar criptografia em repouso, retention policy e trilha de auditoria.
- Estruturar observabilidade com logs sem PII + tracing.
- Formalizar versionamento de ontologia e governanca de mudanças.

## Evidências de validação (verified_by)

- Backend: `uv run ruff check .`, `uv run python -m mypy app`, `uv run pytest --cov=app`.
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test -- --run`.
- Benchmark offline: `uv run python tools/benchmark.py --format json --runs 20`.
