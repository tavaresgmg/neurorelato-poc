# Design: Redesign Clínico do Frontend

**Data**: 2026-02-12
**Status**: Aprovado
**Abordagem**: B — Rewrite Total do OutputPanel

## Contexto

O frontend atual do NeuroRelato apresenta problemas de usabilidade para médicos:
- Excesso de informação sem hierarquia
- Dados técnicos expostos (request ID, método, offsets)
- Sem visualizações gráficas
- Sem progressive disclosure
- UI genérica, não adaptada ao contexto clínico

## Decisões de Design

| Decisão | Escolha |
|---------|---------|
| Foco principal | Triagem rápida dos resultados |
| Hierarquia | Dashboard visual primeiro (radar chart) |
| Info técnica | Esconder completamente |
| Estética | Clean & Clinical (ref: Apple Health, Epic MyChart) |
| Gaps | Integrados ao dashboard (área vazia no radar) |
| Refatoração | Completa — rewrite de todos os componentes de output |

## Arquitetura da Informação: 3 Níveis

### Nível 1 — Dashboard (visão em 3 segundos)
- Radar chart dos domínios (cobertura/confiança por eixo, vazio = gap)
- Resumo em linguagem natural (já vem do backend `summary`)
- Pills de navegação por domínio com indicador de status (dot colorido)
- Contador de gaps como call-to-action

### Nível 2 — Domínio Expandido (click na pill ou radar)
- Expande inline abaixo das pills (sem modal, sem troca de página)
- Findings como lista simples: nome + barra de confiança visual
- Gaps com perguntas sugeridas (quando domínio é lacuna)
- Botão "Copiar perguntas" e "Inserir na narrativa"

### Nível 3 — Evidência (click no finding)
- Accordion inline abaixo do finding
- Quotes com highlight no trecho relevante
- Sem metadata técnico
- Botão "Copiar trecho"

## Linguagem Visual

### Paleta de Status (semáforo médico suave)
- Coberto (com achados): `#2B8A3E` verde sage
- Atenção (poucos dados): `#E67700` âmbar
- Lacuna (gap): `#868E96` cinza
- Negação detectada: `#C92A2A` vermelho suave

### Superfícies
- Background: `#F8F9FA` (cinza quase branco)
- Cards: `#FFFFFF` (branco puro)
- Card hover: `#F1F3F5`
- Borda: `#DEE2E6`
- Texto primário: `#212529`
- Texto secundário: `#868E96`
- Evidência (quotes): `#FFF9DB` (âmbar claro) com highlight

### Tipografia
- Títulos: IBM Plex Sans, 600, 18-24px
- Corpo: IBM Plex Sans, 400, 14-16px
- Badges: IBM Plex Sans, 500, 12px
- Resumo NL: Fraunces, 400, 16px (diferencia texto humano do UI)

### Princípios
- Espaçamento generoso (24px entre seções, 16px entre cards)
- Sem sombras pesadas — bordas sutis
- Cor é semântica, não decorativa
- Ícones mínimos, só onde adicionam clareza

## Componentes

### Novos (5)
1. **ClinicalDashboard** — Radar chart + resumo NL + pills de domínio + contadores
2. **DomainDetail** — Expansão inline com findings e barras de confiança
3. **GapInsight** — Perguntas sugeridas integradas ao domínio (fundo âmbar, ícone lupa)
4. **EvidenceInline** — Accordion com quotes e highlight (substitui modal)
5. **SummaryBanner** — Banner com resumo clínico, fonte serifada, botão copiar

### Simplificados (3)
- **InputPanel** — Remove toggle de embeddings (detalhe técnico)
- **HistoryPanel** — Remove request ID, mostra só data + resumo curto
- **App.tsx** — Remove estados de modal, simplifica layout

### Removidos (4)
- **DomainCard** → substituído por DomainDetail
- **GapsPanel** → substituído por GapInsight (integrado)
- **EvidenceModal** → substituído por EvidenceInline
- **EmptyState** → redesenhado dentro de ClinicalDashboard

## Fluxo de Interação

```
Narrativa (input) → Processar → Loading skeleton do dashboard
    → Dashboard (radar + resumo + pills)
        → Click domínio → DomainDetail inline (findings + gaps)
            → Click finding → EvidenceInline accordion (quotes)
            → Click "Inserir pergunta" → texto volta ao InputPanel
```

## Dependências Técnicas

- **Biblioteca de charts**: recharts ou visx (radar chart)
- **Mantine**: continua como base de componentes
- **Backend**: sem mudanças necessárias (response já tem todos os dados)

## Fora de Escopo

- Mudanças no backend/API
- Internacionalização (permanece pt-BR hardcoded)
- Routing (permanece SPA sem router)
- Dark mode (manter suporte existente mas prioridade é light)
