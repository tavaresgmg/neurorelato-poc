# Frontend Clinical Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reescrever o OutputPanel do NeuroRelato para uma experiência clínica com dashboard visual (radar chart), progressive disclosure em 3 níveis, e remoção de informação técnica.

**Architecture:** Dashboard-first com radar chart (recharts) no topo, pills de navegação por domínio, expansão inline para findings/gaps, e accordion para evidências. Componentes novos substituem DomainCard, GapsPanel, EvidenceModal e EmptyState. InputPanel e HistoryPanel simplificados.

**Tech Stack:** React 19 + TypeScript 5.9 + Mantine 8 + recharts (novo) + Vitest

**Design doc:** `docs/plans/2026-02-12-frontend-clinical-redesign.md`

---

## Task 1: Instalar recharts e configurar dependência

**Files:**
- Modify: `frontend/package.json`

**Step 1: Instalar recharts**

```bash
cd frontend && npm install recharts
```

**Step 2: Verificar que o build funciona**

```bash
cd frontend && npm run typecheck
```
Expected: sem erros

**Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: add recharts for clinical dashboard radar chart"
```

---

## Task 2: Criar utilitário `radarData.ts` com testes

**Files:**
- Create: `frontend/src/lib/radarData.ts`
- Create: `frontend/src/__tests__/radarData.test.ts`

**Step 1: Escrever o teste**

```typescript
// frontend/src/__tests__/radarData.test.ts
import { describe, expect, it } from 'vitest';
import { buildRadarData } from '../lib/radarData';
import type { DomainResult, Gap } from '../api/types';

const makeDomain = (id: string, name: string, scores: number[]): DomainResult => ({
  domain_id: id,
  domain_name: name,
  findings: scores.map((s, i) => ({
    symptom: `finding-${i}`,
    score: s,
    negated: false,
    method: 'heuristic' as const,
    evidence: [],
  })),
});

const makeGap = (id: string, name: string, level: Gap['gap_level']): Gap => ({
  domain_id: id,
  domain_name: name,
  gap_level: level,
  rationale: 'test',
  suggested_questions: ['Pergunta?'],
});

describe('buildRadarData', () => {
  it('returns coverage based on average score for domains with findings', () => {
    const domains = [makeDomain('D1', 'Cognição', [0.9, 0.8])];
    const result = buildRadarData(domains, []);
    expect(result).toHaveLength(1);
    expect(result[0].domain).toBe('Cognição');
    expect(result[0].coverage).toBe(85); // avg(0.9, 0.8) * 100 = 85
    expect(result[0].isGap).toBe(false);
  });

  it('returns 0 coverage for gap-only domains', () => {
    const gaps = [makeGap('D2', 'Linguagem', 'high')];
    const result = buildRadarData([], gaps);
    expect(result).toHaveLength(1);
    expect(result[0].coverage).toBe(0);
    expect(result[0].isGap).toBe(true);
  });

  it('merges domains and gaps correctly', () => {
    const domains = [makeDomain('D1', 'Cognição', [0.9])];
    const gaps = [makeGap('D1', 'Cognição', 'low'), makeGap('D2', 'Motor', 'high')];
    const result = buildRadarData(domains, gaps);
    expect(result).toHaveLength(2);
    const cognition = result.find(r => r.domainId === 'D1')!;
    expect(cognition.coverage).toBe(90);
    expect(cognition.isGap).toBe(true); // has gap even with findings
    const motor = result.find(r => r.domainId === 'D2')!;
    expect(motor.coverage).toBe(0);
    expect(motor.isGap).toBe(true);
  });

  it('returns empty array when no data', () => {
    expect(buildRadarData([], [])).toEqual([]);
  });

  it('marks domain without findings as gap even if not in gaps array', () => {
    const domains = [makeDomain('D1', 'Cognição', [])];
    const result = buildRadarData(domains, []);
    expect(result[0].isGap).toBe(true);
    expect(result[0].coverage).toBe(0);
  });
});
```

**Step 2: Rodar teste para confirmar que falha**

```bash
cd frontend && npx vitest run src/__tests__/radarData.test.ts
```
Expected: FAIL — module not found

**Step 3: Implementar `radarData.ts`**

```typescript
// frontend/src/lib/radarData.ts
import type { DomainResult, Gap } from '../api/types';

export type RadarDataPoint = {
  domain: string;
  domainId: string;
  coverage: number;
  isGap: boolean;
  findingsCount: number;
};

export function buildRadarData(
  domains: DomainResult[],
  gaps: Gap[],
): RadarDataPoint[] {
  const gapMap = new Map(gaps.map((g) => [g.domain_id, g]));
  const domainMap = new Map(domains.map((d) => [d.domain_id, d]));
  const allIds = new Set([...domainMap.keys(), ...gapMap.keys()]);

  return Array.from(allIds).map((id) => {
    const domain = domainMap.get(id);
    const gap = gapMap.get(id);
    const name = domain?.domain_name ?? gap?.domain_name ?? id;
    const findings = domain?.findings ?? [];

    let coverage = 0;
    if (findings.length > 0) {
      const avg = findings.reduce((sum, f) => sum + f.score, 0) / findings.length;
      coverage = Math.round(avg * 100);
    }

    const isGap = gap
      ? gap.gap_level !== 'none'
      : findings.length === 0;

    return { domain: name, domainId: id, coverage, isGap, findingsCount: findings.length };
  });
}
```

**Step 4: Rodar teste para confirmar que passa**

```bash
cd frontend && npx vitest run src/__tests__/radarData.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add -f frontend/src/lib/radarData.ts frontend/src/__tests__/radarData.test.ts
git commit -m "feat: add radarData utility for clinical dashboard"
```

---

## Task 3: Atualizar tema e CSS para paleta clínica

**Files:**
- Modify: `frontend/src/theme.ts`
- Modify: `frontend/src/index.css`

**Step 1: Atualizar `theme.ts`**

Atualizar a paleta de cores mantendo a estrutura existente. Adicionar variáveis semânticas para status clínico:

```typescript
// frontend/src/theme.ts
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
  headings: {
    fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
    fontWeight: '600',
  },
  primaryColor: 'indigo',
  defaultRadius: 'md',
  colors: {
    gray: [
      '#F8F9FA',
      '#F1F3F5',
      '#E9ECEF',
      '#DEE2E6',
      '#CED4DA',
      '#ADB5BD',
      '#868E96',
      '#495057',
      '#343A40',
      '#212529',
    ],
  },
  components: {
    Paper: {
      defaultProps: {
        withBorder: true,
        radius: 'md',
      },
      styles: {
        root: {
          background: 'var(--pn-card)',
          borderColor: 'var(--pn-border)',
        },
      },
    },
  },
});

/** Cores de status clínico (para usar em components) */
export const CLINICAL_COLORS = {
  covered: '#2B8A3E',     // verde sage — domínio com achados
  attention: '#E67700',   // âmbar — poucos dados
  gap: '#868E96',         // cinza — lacuna
  negated: '#C92A2A',     // vermelho — negação
  evidenceBg: '#FFF9DB',  // fundo quotes
} as const;
```

**Step 2: Atualizar `index.css`**

Adicionar variáveis CSS para o dashboard clínico e estilos novos. Manter os existentes que não conflitam:

Adicionar ao final do bloco `:root`:
```css
  /* Clinical dashboard */
  --pn-clinical-covered: #2B8A3E;
  --pn-clinical-attention: #E67700;
  --pn-clinical-gap: #868E96;
  --pn-clinical-negated: #C92A2A;
  --pn-clinical-evidence-bg: #FFF9DB;
```

Adicionar novos estilos:
```css
/* --- Clinical Dashboard --- */
.pn-domain-pill {
  cursor: pointer;
  transition: all 150ms ease;
  border: 1.5px solid transparent;
}

.pn-domain-pill:hover {
  transform: translateY(-1px);
}

.pn-domain-pill--active {
  border-color: var(--mantine-color-indigo-4);
  background: var(--mantine-color-indigo-0);
}

.pn-domain-pill--gap {
  border-style: dashed;
  border-color: var(--pn-clinical-gap);
}

/* Evidence inline */
.pn-evidence-inline {
  border-left: 3px solid var(--mantine-color-indigo-4);
  padding-left: 12px;
  background: var(--pn-clinical-evidence-bg);
  border-radius: 0 var(--mantine-radius-sm) var(--mantine-radius-sm) 0;
  padding: 12px 16px;
}

/* Summary banner */
.pn-summary-banner {
  background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
  border: 1px solid #DEE2E6;
  border-radius: var(--mantine-radius-md);
  padding: 16px 20px;
}

/* Confidence bar (simplified) */
.pn-confidence-bar {
  height: 4px;
  border-radius: 2px;
  background: #E9ECEF;
  overflow: hidden;
}

.pn-confidence-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 300ms ease;
}
```

E adicionar os overrides de dark mode correspondentes:
```css
[data-mantine-color-scheme="dark"] .pn-domain-pill--active {
  border-color: var(--mantine-color-indigo-7);
  background: rgba(99, 102, 241, 0.1);
}

[data-mantine-color-scheme="dark"] .pn-evidence-inline {
  background: rgba(255, 249, 219, 0.06);
}

[data-mantine-color-scheme="dark"] .pn-summary-banner {
  background: linear-gradient(135deg, rgba(30, 30, 46, 0.9) 0%, rgba(40, 40, 56, 0.9) 100%);
  border-color: var(--pn-border);
}
```

**Step 3: Verificar typecheck**

```bash
cd frontend && npm run typecheck
```
Expected: PASS

**Step 4: Commit**

```bash
git add -f frontend/src/theme.ts frontend/src/index.css
git commit -m "style: clinical color palette and dashboard CSS variables"
```

---

## Task 4: Criar componente `SummaryBanner`

**Files:**
- Create: `frontend/src/components/SummaryBanner.tsx`
- Create: `frontend/src/__tests__/SummaryBanner.test.tsx`

**Step 1: Escrever o teste**

```typescript
// frontend/src/__tests__/SummaryBanner.test.tsx
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import { SummaryBanner } from '../components/SummaryBanner';

describe('SummaryBanner', () => {
  it('renders summary text', () => {
    renderWithProviders(
      <SummaryBanner text="Cognição e Humor bem documentados." totalFindings={6} totalGaps={2} />,
    );
    expect(screen.getByText(/Cognição e Humor bem documentados/)).toBeInTheDocument();
  });

  it('renders findings and gaps counters', () => {
    renderWithProviders(
      <SummaryBanner text="Resumo." totalFindings={6} totalGaps={2} />,
    );
    expect(screen.getByText(/6 achados/)).toBeInTheDocument();
    expect(screen.getByText(/2 lacunas/)).toBeInTheDocument();
  });

  it('renders nothing when text is null', () => {
    const { container } = renderWithProviders(
      <SummaryBanner text={null} totalFindings={0} totalGaps={0} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows copy button', () => {
    renderWithProviders(
      <SummaryBanner text="Resumo clínico." totalFindings={3} totalGaps={1} />,
    );
    expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
  });
});
```

**Step 2: Rodar para confirmar falha**

```bash
cd frontend && npx vitest run src/__tests__/SummaryBanner.test.tsx
```

**Step 3: Implementar**

```typescript
// frontend/src/components/SummaryBanner.tsx
import { ActionIcon, Badge, CopyButton, Group, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy, IconNotes, IconSearch } from '@tabler/icons-react';

type Props = {
  text: string | null;
  totalFindings: number;
  totalGaps: number;
};

export function SummaryBanner({ text, totalFindings, totalGaps }: Props) {
  if (!text) return null;

  return (
    <div className="pn-summary-banner">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ flex: 1 }}>
          <Text
            size="md"
            style={{ whiteSpace: 'pre-wrap', fontFamily: '"Fraunces", serif', lineHeight: 1.6 }}
          >
            {text}
          </Text>
          <Group gap="sm" mt="sm">
            <Badge
              variant="light"
              color="green"
              leftSection={<IconNotes size={12} />}
            >
              {totalFindings} achados
            </Badge>
            {totalGaps > 0 && (
              <Badge
                variant="light"
                color="orange"
                leftSection={<IconSearch size={12} />}
              >
                {totalGaps} lacunas
              </Badge>
            )}
          </Group>
        </div>
        <CopyButton value={text} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copiado!' : 'Copiar resumo'}>
              <ActionIcon
                variant="subtle"
                color={copied ? 'indigo' : 'gray'}
                onClick={copy}
                aria-label="Copiar resumo"
              >
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </div>
  );
}
```

**Step 4: Rodar para confirmar que passa**

```bash
cd frontend && npx vitest run src/__tests__/SummaryBanner.test.tsx
```

**Step 5: Commit**

```bash
git add -f frontend/src/components/SummaryBanner.tsx frontend/src/__tests__/SummaryBanner.test.tsx
git commit -m "feat: add SummaryBanner component for clinical summary"
```

---

## Task 5: Criar componente `EvidenceInline`

**Files:**
- Create: `frontend/src/components/EvidenceInline.tsx`
- Create: `frontend/src/__tests__/EvidenceInline.test.tsx`

**Step 1: Escrever o teste**

```typescript
// frontend/src/__tests__/EvidenceInline.test.tsx
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import { EvidenceInline } from '../components/EvidenceInline';
import type { Evidence } from '../api/types';

const mockEvidence: Evidence[] = [
  { quote: 'a criança não consegue manter atenção', start: 10, end: 50 },
  { quote: 'em casa também se distrai facilmente', start: 100, end: 140 },
];

describe('EvidenceInline', () => {
  it('renders evidence quotes', () => {
    renderWithProviders(<EvidenceInline evidence={mockEvidence} />);
    expect(screen.getByText(/a criança não consegue manter atenção/)).toBeInTheDocument();
    expect(screen.getByText(/em casa também se distrai facilmente/)).toBeInTheDocument();
  });

  it('renders copy button for each quote', () => {
    renderWithProviders(<EvidenceInline evidence={mockEvidence} />);
    const buttons = screen.getAllByRole('button', { name: /copiar/i });
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders empty message when no evidence', () => {
    renderWithProviders(<EvidenceInline evidence={[]} />);
    expect(screen.getByText(/sem evidências/i)).toBeInTheDocument();
  });

  it('highlights evidence in source text when provided', () => {
    renderWithProviders(
      <EvidenceInline
        evidence={[{ quote: 'manter atenção', start: 10, end: 24 }]}
        sourceText="prefixo - manter atenção - sufixo"
      />,
    );
    expect(screen.getByText('manter atenção')).toBeInTheDocument();
  });
});
```

**Step 2: Rodar para confirmar falha**

```bash
cd frontend && npx vitest run src/__tests__/EvidenceInline.test.tsx
```

**Step 3: Implementar**

```typescript
// frontend/src/components/EvidenceInline.tsx
import { ActionIcon, Box, CopyButton, Group, Mark, Stack, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';

import type { Evidence } from '../api/types';

type Props = {
  evidence: Evidence[];
  sourceText?: string | null;
};

export function EvidenceInline({ evidence, sourceText }: Props) {
  if (evidence.length === 0) {
    return (
      <Text size="sm" c="dimmed" py="xs">
        Sem evidências registradas.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {evidence.map((ev, i) => (
        <div key={i} className="pn-evidence-inline">
          <Group gap="xs" wrap="nowrap" align="flex-start">
            <Text size="sm" fs="italic" style={{ whiteSpace: 'pre-wrap', flex: 1 }}>
              &ldquo;{ev.quote}&rdquo;
            </Text>
            <CopyButton value={ev.quote} timeout={1500}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copiado!' : 'Copiar trecho'}>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color={copied ? 'indigo' : 'gray'}
                    onClick={copy}
                    aria-label="Copiar trecho"
                  >
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          {sourceText && (
            <Box mt="xs">
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {renderContext(sourceText, ev)}
              </Text>
            </Box>
          )}
        </div>
      ))}
    </Stack>
  );
}

function renderContext(sourceText: string, ev: Evidence) {
  const s = Math.max(0, Math.min(ev.start, sourceText.length));
  const e = Math.max(0, Math.min(ev.end, sourceText.length));
  if (e <= s) return sourceText.slice(Math.max(0, s - 60), Math.min(sourceText.length, s + 60));

  const ctxStart = Math.max(0, s - 60);
  const ctxEnd = Math.min(sourceText.length, e + 60);
  const before = sourceText.slice(ctxStart, s);
  const hit = sourceText.slice(s, e);
  const after = sourceText.slice(e, ctxEnd);

  return (
    <>
      {ctxStart > 0 && '…'}
      {before}
      <Mark color="yellow" style={{ padding: '1px 2px', fontWeight: 600 }}>
        {hit}
      </Mark>
      {after}
      {ctxEnd < sourceText.length && '…'}
    </>
  );
}
```

**Step 4: Rodar para confirmar que passa**

```bash
cd frontend && npx vitest run src/__tests__/EvidenceInline.test.tsx
```

**Step 5: Commit**

```bash
git add -f frontend/src/components/EvidenceInline.tsx frontend/src/__tests__/EvidenceInline.test.tsx
git commit -m "feat: add EvidenceInline component (replaces EvidenceModal)"
```

---

## Task 6: Criar componente `GapInsight`

**Files:**
- Create: `frontend/src/components/GapInsight.tsx`
- Create: `frontend/src/__tests__/GapInsight.test.tsx`

**Step 1: Escrever o teste**

```typescript
// frontend/src/__tests__/GapInsight.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './test-utils';
import { GapInsight } from '../components/GapInsight';
import type { Gap } from '../api/types';

const mockGap: Gap = {
  domain_id: 'D1',
  domain_name: 'Linguagem',
  gap_level: 'high',
  rationale: 'Pouco explorado na narrativa.',
  suggested_questions: [
    'Como está o desenvolvimento da fala?',
    'Há dificuldade de compreensão verbal?',
  ],
};

describe('GapInsight', () => {
  it('renders gap domain name and rationale', () => {
    renderWithProviders(<GapInsight gap={mockGap} />);
    expect(screen.getByText(/Pouco explorado na narrativa/)).toBeInTheDocument();
  });

  it('renders suggested questions', () => {
    renderWithProviders(<GapInsight gap={mockGap} />);
    expect(screen.getByText(/Como está o desenvolvimento da fala/)).toBeInTheDocument();
    expect(screen.getByText(/Há dificuldade de compreensão verbal/)).toBeInTheDocument();
  });

  it('calls onInsertQuestion when insert button clicked', async () => {
    const handler = vi.fn();
    renderWithProviders(<GapInsight gap={mockGap} onInsertQuestion={handler} />);
    const insertButtons = screen.getAllByRole('button', { name: /inserir/i });
    await userEvent.click(insertButtons[0]);
    expect(handler).toHaveBeenCalledWith('Como está o desenvolvimento da fala?');
  });

  it('renders nothing for gap_level none', () => {
    const noGap = { ...mockGap, gap_level: 'none' as const, suggested_questions: [] };
    const { container } = renderWithProviders(<GapInsight gap={noGap} />);
    expect(container.firstChild).toBeNull();
  });
});
```

**Nota:** Para este teste funcionar, precisa instalar `@testing-library/user-event` se não estiver instalado:
```bash
cd frontend && npm install -D @testing-library/user-event
```

**Step 2: Rodar para confirmar falha**

```bash
cd frontend && npx vitest run src/__tests__/GapInsight.test.tsx
```

**Step 3: Implementar**

```typescript
// frontend/src/components/GapInsight.tsx
import { ActionIcon, CopyButton, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconArrowBack, IconCheck, IconCopy, IconSearch } from '@tabler/icons-react';

import type { Gap } from '../api/types';

type Props = {
  gap: Gap;
  onInsertQuestion?: (question: string) => void;
};

export function GapInsight({ gap, onInsertQuestion }: Props) {
  if (gap.gap_level === 'none' && gap.suggested_questions.length === 0) return null;

  return (
    <Stack gap="xs" py="sm" px="md" style={{
      background: 'rgba(230, 119, 0, 0.06)',
      borderRadius: 'var(--mantine-radius-sm)',
      border: '1px dashed rgba(230, 119, 0, 0.3)',
    }}>
      <Group gap="xs">
        <IconSearch size={14} style={{ color: '#E67700' }} />
        <Text size="sm" fw={600} c="orange.8">
          Investigar
        </Text>
      </Group>
      {gap.rationale && (
        <Text size="sm" c="dimmed">{gap.rationale}</Text>
      )}
      {gap.suggested_questions.length > 0 && (
        <Stack gap={4}>
          {gap.suggested_questions.map((q) => (
            <Group key={q} gap="xs" wrap="nowrap" align="flex-start">
              <Text size="sm" style={{ flex: 1 }}>
                &rarr; {q}
              </Text>
              <Group gap={2} wrap="nowrap">
                {onInsertQuestion && (
                  <Tooltip label="Inserir na narrativa">
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="orange"
                      onClick={() => onInsertQuestion(q)}
                      aria-label="Inserir pergunta"
                    >
                      <IconArrowBack size={12} />
                    </ActionIcon>
                  </Tooltip>
                )}
                <CopyButton value={q} timeout={1500}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copiado' : 'Copiar pergunta'}>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color={copied ? 'indigo' : 'gray'}
                        onClick={copy}
                        aria-label="Copiar pergunta"
                      >
                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
```

**Step 4: Rodar para confirmar que passa**

```bash
cd frontend && npx vitest run src/__tests__/GapInsight.test.tsx
```

**Step 5: Commit**

```bash
git add -f frontend/src/components/GapInsight.tsx frontend/src/__tests__/GapInsight.test.tsx
git commit -m "feat: add GapInsight component (integrated gap display)"
```

---

## Task 7: Criar componente `DomainDetail`

**Files:**
- Create: `frontend/src/components/DomainDetail.tsx`
- Create: `frontend/src/__tests__/DomainDetail.test.tsx`

**Step 1: Escrever o teste**

```typescript
// frontend/src/__tests__/DomainDetail.test.tsx
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './test-utils';
import { DomainDetail } from '../components/DomainDetail';
import type { DomainResult, Gap } from '../api/types';

const mockDomain: DomainResult = {
  domain_id: 'DOM_01',
  domain_name: 'Interação Social',
  findings: [
    {
      symptom: 'Evita contato visual',
      score: 0.92,
      negated: false,
      method: 'heuristic',
      evidence: [{ quote: 'não olha nos olhos', start: 10, end: 30 }],
    },
    {
      symptom: 'Isolamento social',
      score: 0.78,
      negated: false,
      method: 'embeddings',
      evidence: [{ quote: 'brinca sozinho', start: 50, end: 65 }],
    },
  ],
};

const mockGap: Gap = {
  domain_id: 'DOM_02',
  domain_name: 'Linguagem',
  gap_level: 'high',
  rationale: 'Pouco explorado.',
  suggested_questions: ['Pergunta teste?'],
};

describe('DomainDetail', () => {
  it('renders domain name and finding count', () => {
    renderWithProviders(<DomainDetail domain={mockDomain} />);
    expect(screen.getByText('Interação Social')).toBeInTheDocument();
    expect(screen.getByText(/2 achados/)).toBeInTheDocument();
  });

  it('renders all findings sorted by score descending', () => {
    renderWithProviders(<DomainDetail domain={mockDomain} />);
    expect(screen.getByText('Evita contato visual')).toBeInTheDocument();
    expect(screen.getByText('Isolamento social')).toBeInTheDocument();
  });

  it('expands evidence on finding click', async () => {
    renderWithProviders(
      <DomainDetail domain={mockDomain} sourceText="...não olha nos olhos..." />,
    );
    await userEvent.click(screen.getByText('Evita contato visual'));
    expect(screen.getByText(/não olha nos olhos/)).toBeInTheDocument();
  });

  it('renders gap insight when gap is provided', () => {
    const gapDomain: DomainResult = {
      domain_id: 'DOM_02',
      domain_name: 'Linguagem',
      findings: [],
    };
    renderWithProviders(<DomainDetail domain={gapDomain} gap={mockGap} />);
    expect(screen.getByText(/Pergunta teste/)).toBeInTheDocument();
  });

  it('shows negation indicator for negated findings', () => {
    const domain: DomainResult = {
      ...mockDomain,
      findings: [{
        symptom: 'Estereotipias',
        score: 0.7,
        negated: true,
        method: 'heuristic',
        evidence: [],
      }],
    };
    renderWithProviders(<DomainDetail domain={domain} />);
    expect(screen.getByText('Negado')).toBeInTheDocument();
  });
});
```

**Step 2: Rodar para confirmar falha**

```bash
cd frontend && npx vitest run src/__tests__/DomainDetail.test.tsx
```

**Step 3: Implementar**

```typescript
// frontend/src/components/DomainDetail.tsx
import { Badge, Box, Collapse, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';

import type { DomainResult, Finding, Gap } from '../api/types';
import { CLINICAL_COLORS } from '../theme';
import { EvidenceInline } from './EvidenceInline';
import { GapInsight } from './GapInsight';

type Props = {
  domain: DomainResult;
  gap?: Gap;
  sourceText?: string | null;
  onInsertQuestion?: (question: string) => void;
};

function confidenceColor(score: number): string {
  if (score >= 0.85) return CLINICAL_COLORS.covered;
  if (score >= 0.65) return CLINICAL_COLORS.attention;
  return CLINICAL_COLORS.gap;
}

function FindingRow({ finding, sourceText }: { finding: Finding; sourceText?: string | null }) {
  const [opened, { toggle }] = useDisclosure(false);
  const pct = Math.round(finding.score * 100);

  return (
    <Box>
      <UnstyledButton onClick={toggle} w="100%" py={6}>
        <Group justify="space-between" align="center" gap="xs">
          <Group gap="xs" style={{ flex: 1 }}>
            {opened ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            <Text size="sm" fw={500}>
              {finding.symptom}
            </Text>
            {finding.negated && (
              <Badge color="red" variant="filled" size="xs">
                Negado
              </Badge>
            )}
          </Group>
          <Group gap="xs" wrap="nowrap">
            <div className="pn-confidence-bar" style={{ width: 60 }}>
              <div
                className="pn-confidence-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: confidenceColor(finding.score),
                }}
              />
            </div>
          </Group>
        </Group>
      </UnstyledButton>
      <Collapse in={opened}>
        <Box pl={22} pb="sm">
          <EvidenceInline evidence={finding.evidence} sourceText={sourceText} />
        </Box>
      </Collapse>
    </Box>
  );
}

export function DomainDetail({ domain, gap, sourceText, onInsertQuestion }: Props) {
  const sorted = [...domain.findings].sort((a, b) => b.score - a.score);

  return (
    <Paper radius="md" p="md">
      <Group justify="space-between" align="center" mb="sm">
        <Text fw={600} size="md">{domain.domain_name}</Text>
        <Badge variant="light" color={sorted.length > 0 ? 'green' : 'gray'}>
          {sorted.length} achados
        </Badge>
      </Group>

      {sorted.length > 0 && (
        <Stack gap={0}>
          {sorted.map((f, idx) => (
            <FindingRow key={`${f.symptom}-${idx}`} finding={f} sourceText={sourceText} />
          ))}
        </Stack>
      )}

      {gap && <GapInsight gap={gap} onInsertQuestion={onInsertQuestion} />}
    </Paper>
  );
}
```

**Step 4: Rodar para confirmar que passa**

```bash
cd frontend && npx vitest run src/__tests__/DomainDetail.test.tsx
```

**Step 5: Commit**

```bash
git add -f frontend/src/components/DomainDetail.tsx frontend/src/__tests__/DomainDetail.test.tsx
git commit -m "feat: add DomainDetail component with inline evidence expansion"
```

---

## Task 8: Criar componente `ClinicalDashboard`

**Files:**
- Create: `frontend/src/components/ClinicalDashboard.tsx`
- Create: `frontend/src/__tests__/ClinicalDashboard.test.tsx`

**Step 1: Escrever o teste**

```typescript
// frontend/src/__tests__/ClinicalDashboard.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './test-utils';
import { ClinicalDashboard } from '../components/ClinicalDashboard';
import type { NormalizeResponse } from '../api/types';

const mockResult: NormalizeResponse = {
  request_id: 'test-123',
  created_at: '2026-02-12T10:00:00Z',
  ontology: { version: '1.0', source: 'test' },
  input: { text_length: 100, was_anonymized: true, redacted_text: 'texto redacted...' },
  domains: [
    {
      domain_id: 'DOM_01',
      domain_name: 'Interação Social',
      findings: [
        { symptom: 'Contato visual reduzido', score: 0.92, negated: false, method: 'heuristic', evidence: [] },
        { symptom: 'Isolamento', score: 0.78, negated: false, method: 'heuristic', evidence: [] },
      ],
    },
    {
      domain_id: 'DOM_03',
      domain_name: 'TDAH',
      findings: [
        { symptom: 'Desatenção', score: 0.85, negated: false, method: 'embeddings', evidence: [] },
      ],
    },
  ],
  gaps: [
    {
      domain_id: 'DOM_02',
      domain_name: 'Comportamento Repetitivo',
      gap_level: 'high',
      rationale: 'Pouco explorado.',
      suggested_questions: ['Há estereotipias?'],
    },
  ],
  summary: { text: 'Resumo clínico de teste.', generated_by: 'template' },
  warnings: [],
};

describe('ClinicalDashboard', () => {
  it('renders summary banner', () => {
    renderWithProviders(<ClinicalDashboard result={mockResult} />);
    expect(screen.getByText(/Resumo clínico de teste/)).toBeInTheDocument();
  });

  it('renders domain pills for all domains', () => {
    renderWithProviders(<ClinicalDashboard result={mockResult} />);
    expect(screen.getByText('Interação Social')).toBeInTheDocument();
    expect(screen.getByText('TDAH')).toBeInTheDocument();
    expect(screen.getByText('Comportamento Repetitivo')).toBeInTheDocument();
  });

  it('expands domain detail when pill is clicked', async () => {
    renderWithProviders(<ClinicalDashboard result={mockResult} />);
    await userEvent.click(screen.getByText('Interação Social'));
    expect(screen.getByText('Contato visual reduzido')).toBeInTheDocument();
  });

  it('shows gap indicator on gap domain pills', () => {
    renderWithProviders(<ClinicalDashboard result={mockResult} />);
    // Gap pill should have the gap visual class
    const gapPill = screen.getByText('Comportamento Repetitivo').closest('[class*="pn-domain-pill"]');
    expect(gapPill?.className).toContain('pn-domain-pill--gap');
  });

  it('renders radar chart container', () => {
    renderWithProviders(<ClinicalDashboard result={mockResult} />);
    // recharts renders an SVG with a .recharts-wrapper class
    const wrapper = document.querySelector('.recharts-responsive-container');
    expect(wrapper).toBeInTheDocument();
  });
});
```

**Step 2: Rodar para confirmar falha**

```bash
cd frontend && npx vitest run src/__tests__/ClinicalDashboard.test.tsx
```

**Step 3: Implementar**

```typescript
// frontend/src/components/ClinicalDashboard.tsx
import { Box, Collapse, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconCircleFilled, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

import type { NormalizeResponse } from '../api/types';
import { buildRadarData, type RadarDataPoint } from '../lib/radarData';
import { CLINICAL_COLORS } from '../theme';
import { DomainDetail } from './DomainDetail';
import { SummaryBanner } from './SummaryBanner';

type Props = {
  result: NormalizeResponse;
  onInsertQuestion?: (question: string) => void;
};

function DomainPill({
  point,
  isActive,
  onClick,
}: {
  point: RadarDataPoint;
  isActive: boolean;
  onClick: () => void;
}) {
  const dotColor = point.isGap
    ? CLINICAL_COLORS.gap
    : point.coverage >= 75
      ? CLINICAL_COLORS.covered
      : CLINICAL_COLORS.attention;

  const className = [
    'pn-domain-pill',
    isActive && 'pn-domain-pill--active',
    point.isGap && point.findingsCount === 0 && 'pn-domain-pill--gap',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <UnstyledButton
      className={className}
      onClick={onClick}
      px="sm"
      py={6}
      style={{ borderRadius: 'var(--mantine-radius-xl)' }}
    >
      <Group gap={6} wrap="nowrap">
        {point.isGap && point.findingsCount === 0 ? (
          <IconSearch size={12} style={{ color: CLINICAL_COLORS.gap }} />
        ) : (
          <IconCircleFilled size={8} style={{ color: dotColor }} />
        )}
        <Text size="sm" fw={500}>
          {point.domain}
        </Text>
        {point.findingsCount > 0 && (
          <Text size="xs" c="dimmed">
            {point.findingsCount}
          </Text>
        )}
      </Group>
    </UnstyledButton>
  );
}

export function ClinicalDashboard({ result, onInsertQuestion }: Props) {
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const radarData = buildRadarData(result.domains, result.gaps);

  const totalFindings = result.domains.reduce((acc, d) => acc + d.findings.length, 0);
  const gapMap = new Map(result.gaps.map((g) => [g.domain_id, g]));
  const domainMap = new Map(result.domains.map((d) => [d.domain_id, d]));

  function toggleDomain(id: string) {
    setActiveDomainId((prev) => (prev === id ? null : id));
  }

  const activeDomain = activeDomainId ? domainMap.get(activeDomainId) : null;
  const activeGap = activeDomainId ? gapMap.get(activeDomainId) : null;

  // For gap-only domains that don't have a DomainResult, create a stub
  const activeDomainResult = activeDomain ?? (activeDomainId
    ? {
        domain_id: activeDomainId,
        domain_name: activeGap?.domain_name ?? activeDomainId,
        findings: [],
      }
    : null);

  return (
    <Stack gap="md">
      {/* Summary */}
      <SummaryBanner
        text={result.summary?.text ?? null}
        totalFindings={totalFindings}
        totalGaps={result.gaps.filter((g) => g.gap_level !== 'none').length}
      />

      {/* Radar + Pills */}
      <Group align="flex-start" gap="lg" wrap="nowrap">
        {radarData.length > 2 && (
          <Box style={{ width: 220, height: 200, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#DEE2E6" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fontSize: 11, fill: '#868E96' }}
                />
                <Radar
                  dataKey="coverage"
                  stroke="#4C6EF5"
                  fill="#4C6EF5"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Box>
        )}

        <Box style={{ flex: 1 }}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">
            Domínios
          </Text>
          <Group gap="xs">
            {radarData.map((point) => (
              <DomainPill
                key={point.domainId}
                point={point}
                isActive={activeDomainId === point.domainId}
                onClick={() => toggleDomain(point.domainId)}
              />
            ))}
          </Group>
        </Box>
      </Group>

      {/* Domain Detail (inline expand) */}
      <Collapse in={!!activeDomainResult}>
        {activeDomainResult && (
          <DomainDetail
            domain={activeDomainResult}
            gap={activeGap}
            sourceText={result.input?.redacted_text}
            onInsertQuestion={onInsertQuestion}
          />
        )}
      </Collapse>
    </Stack>
  );
}
```

**Step 4: Rodar para confirmar que passa**

```bash
cd frontend && npx vitest run src/__tests__/ClinicalDashboard.test.tsx
```

**Nota:** recharts pode precisar de mocks no ambiente jsdom. Se necessário, adicionar ao `setupTests.ts`:
```typescript
// Mock para recharts ResponsiveContainer no jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div className="recharts-responsive-container">{children}</div>
    ),
  };
});
```

**Step 5: Commit**

```bash
git add -f frontend/src/components/ClinicalDashboard.tsx frontend/src/__tests__/ClinicalDashboard.test.tsx
git commit -m "feat: add ClinicalDashboard with radar chart and domain pills"
```

---

## Task 9: Reescrever `OutputPanel` para usar novos componentes

**Files:**
- Modify: `frontend/src/components/OutputPanel.tsx`
- Modify: `frontend/src/__tests__/OutputPanel.test.tsx`

**Step 1: Reescrever OutputPanel**

O novo `OutputPanel` se torna um wrapper fino que delega para `ClinicalDashboard`:

```typescript
// frontend/src/components/OutputPanel.tsx
import { Loader, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { IconBrain } from '@tabler/icons-react';
import { forwardRef } from 'react';

import type { NormalizeResponse } from '../api/types';
import { ClinicalDashboard } from './ClinicalDashboard';
import { EmptyState } from './EmptyState';

type Props = {
  result: NormalizeResponse | null;
  loading: boolean;
  onInsertQuestion?: (question: string) => void;
};

export const OutputPanel = forwardRef<HTMLDivElement, Props>(function OutputPanel(
  { result, loading, onInsertQuestion },
  ref,
) {
  return (
    <div ref={ref}>
      {loading && !result ? (
        <Paper p="lg" radius="lg">
          <Stack gap="md" align="center" py="xl">
            <Loader size="md" />
            <Text size="sm" c="dimmed" fw={500}>
              Analisando narrativa clínica…
            </Text>
            <Stack gap="xs" w="100%">
              <Skeleton height={60} radius="md" />
              <Skeleton height={180} radius="md" />
              <Skeleton height={40} radius="md" />
            </Stack>
          </Stack>
        </Paper>
      ) : !result ? (
        <Paper p="lg" radius="lg">
          <EmptyState
            icon={<IconBrain size={24} />}
            title="Pronto para analisar"
            description="Cole ou dite a narrativa clínica e clique em Processar."
          />
        </Paper>
      ) : (
        <ClinicalDashboard result={result} onInsertQuestion={onInsertQuestion} />
      )}
    </div>
  );
});
```

**Step 2: Atualizar o teste de OutputPanel**

Simplificar para testar os 3 estados (loading, empty, com resultado) sem referências a componentes antigos:

```typescript
// frontend/src/__tests__/OutputPanel.test.tsx
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import { OutputPanel } from '../components/OutputPanel';
import type { NormalizeResponse } from '../api/types';

const mockResult: NormalizeResponse = {
  request_id: 'r-1',
  created_at: '2026-02-12T10:00:00Z',
  ontology: { version: '1.0', source: 'test' },
  input: { text_length: 100, was_anonymized: true },
  domains: [
    {
      domain_id: 'D1',
      domain_name: 'Cognição',
      findings: [
        { symptom: 'Desatenção', score: 0.9, negated: false, method: 'heuristic', evidence: [] },
      ],
    },
  ],
  gaps: [],
  summary: { text: 'Resumo de teste.', generated_by: 'template' },
  warnings: [],
};

describe('OutputPanel', () => {
  it('shows empty state when no result and not loading', () => {
    renderWithProviders(<OutputPanel result={null} loading={false} />);
    expect(screen.getByText(/Pronto para analisar/)).toBeInTheDocument();
  });

  it('shows loading skeleton', () => {
    renderWithProviders(<OutputPanel result={null} loading={true} />);
    expect(screen.getByText(/Analisando narrativa/)).toBeInTheDocument();
  });

  it('renders clinical dashboard when result is present', () => {
    renderWithProviders(<OutputPanel result={mockResult} loading={false} />);
    expect(screen.getByText(/Resumo de teste/)).toBeInTheDocument();
    expect(screen.getByText('Cognição')).toBeInTheDocument();
  });
});
```

**Step 3: Rodar testes**

```bash
cd frontend && npx vitest run src/__tests__/OutputPanel.test.tsx
```

**Step 4: Commit**

```bash
git add -f frontend/src/components/OutputPanel.tsx frontend/src/__tests__/OutputPanel.test.tsx
git commit -m "refactor: rewrite OutputPanel to use ClinicalDashboard"
```

---

## Task 10: Simplificar `InputPanel` — remover toggle de embeddings

**Files:**
- Modify: `frontend/src/components/InputPanel.tsx`
- Modify: `frontend/src/__tests__/InputPanel.test.tsx`

**Step 1: Remover a prop `enableEmbeddings` / `onChangeEnableEmbeddings` e o Checkbox**

No `InputPanel.tsx`:
- Remover as props `enableEmbeddings` e `onChangeEnableEmbeddings` do tipo `Props`
- Remover o import de `Checkbox` e `IconFlask2` (se não mais necessário)
- Remover o bloco `<Tooltip label="Método IA..."><Checkbox ... /></Tooltip>`
- O Group inferior fica só com os botões Processar e Limpar

**Step 2: Atualizar testes para não referenciar Embeddings**

Remover qualquer teste que verifique o checkbox de embeddings.

**Step 3: Rodar testes**

```bash
cd frontend && npx vitest run src/__tests__/InputPanel.test.tsx
```

**Step 4: Commit**

```bash
git add -f frontend/src/components/InputPanel.tsx frontend/src/__tests__/InputPanel.test.tsx
git commit -m "refactor: remove embeddings toggle from InputPanel (technical detail)"
```

---

## Task 11: Simplificar `HistoryPanel` — remover request ID

**Files:**
- Modify: `frontend/src/components/HistoryPanel.tsx`
- Modify: `frontend/src/__tests__/HistoryPanel.test.tsx`

**Step 1: Simplificar o filtro de busca**

No `HistoryPanel.tsx`:
- Remover a lógica de filtro por `request_id` e `qId` do `useMemo`
- Manter busca por data e contagens
- No item de histórico, substituir o texto `{h.findings_count} achados · {h.gaps_count} lacunas` mantendo, mas removendo qualquer referência a request_id na UI

**Step 2: Atualizar testes**

Remover testes que buscam por request ID.

**Step 3: Rodar testes**

```bash
cd frontend && npx vitest run src/__tests__/HistoryPanel.test.tsx
```

**Step 4: Commit**

```bash
git add -f frontend/src/components/HistoryPanel.tsx frontend/src/__tests__/HistoryPanel.test.tsx
git commit -m "refactor: simplify HistoryPanel, remove request ID from UI"
```

---

## Task 12: Atualizar `App.tsx` — remover EvidenceModal e simplificar

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/__tests__/App.test.tsx`

**Step 1: Remover do App.tsx:**
- Import e uso de `EvidenceModal` e `EvidenceModalState`
- Estado `evidenceModal` e `setEvidenceModal`
- Função `openEvidence`
- Import de `Finding`
- Renderização de `<EvidenceModal>`

**Step 2: Simplificar a prop passada ao OutputPanel:**

Antes:
```tsx
<OutputPanel
  ref={outputRef}
  result={controller.result}
  loading={controller.loading}
  onOpenEvidence={openEvidence}
  onInsertQuestion={controller.onInsertQuestion}
/>
```

Depois:
```tsx
<OutputPanel
  ref={outputRef}
  result={controller.result}
  loading={controller.loading}
  onInsertQuestion={controller.onInsertQuestion}
/>
```

**Step 3: Simplificar as props do InputPanel:**

Remover `enableEmbeddings` e `onChangeEnableEmbeddings`:
```tsx
<InputPanel
  text={controller.text}
  onChangeText={controller.setText}
  canProcess={controller.canProcess}
  loading={controller.loading}
  onProcess={controller.onProcess}
  onClear={controller.onClearText}
  speech={speech}
  onUseTranscript={controller.onUseTranscript}
/>
```

**Step 4: Atualizar App.test.tsx**

Remover testes que interagem com EvidenceModal ou o checkbox de Embeddings.

**Step 5: Rodar todos os testes**

```bash
cd frontend && npx vitest run
```

**Step 6: Commit**

```bash
git add -f frontend/src/App.tsx frontend/src/__tests__/App.test.tsx
git commit -m "refactor: remove EvidenceModal from App, simplify output flow"
```

---

## Task 13: Limpar componentes antigos

**Files:**
- Delete: `frontend/src/components/DomainCard.tsx`
- Delete: `frontend/src/components/GapsPanel.tsx`
- Delete: `frontend/src/components/EvidenceModal.tsx`
- Delete: `frontend/src/__tests__/DomainCard.test.tsx`
- Delete: `frontend/src/__tests__/GapsPanel.test.tsx`
- Delete: `frontend/src/__tests__/EvidenceModal.test.tsx`

**Step 1: Verificar que nenhum outro arquivo importa esses componentes**

```bash
cd frontend && grep -r "DomainCard\|GapsPanel\|EvidenceModal" src/ --include="*.ts" --include="*.tsx" | grep -v "__tests__" | grep -v "DomainCard.tsx" | grep -v "GapsPanel.tsx" | grep -v "EvidenceModal.tsx"
```
Expected: nenhum resultado (se Task 9 e 12 foram feitas corretamente)

**Step 2: Deletar arquivos**

```bash
cd frontend && rm src/components/DomainCard.tsx src/components/GapsPanel.tsx src/components/EvidenceModal.tsx
cd frontend && rm src/__tests__/DomainCard.test.tsx src/__tests__/GapsPanel.test.tsx src/__tests__/EvidenceModal.test.tsx
```

**Step 3: Rodar todos os testes**

```bash
cd frontend && npx vitest run
```
Expected: PASS (sem imports quebrados)

**Step 4: Rodar typecheck**

```bash
cd frontend && npm run typecheck
```
Expected: sem erros

**Step 5: Commit**

```bash
git add -A frontend/src/
git commit -m "chore: remove old DomainCard, GapsPanel, EvidenceModal components"
```

---

## Task 14: Rodar suite completa e verificar cobertura

**Files:** Nenhum novo — apenas verificação.

**Step 1: Rodar todos os testes com cobertura**

```bash
cd frontend && npm run test:coverage
```

Expected: todos passando. Se cobertura cair abaixo do threshold (80%), identificar os gaps e adicionar testes nos componentes novos.

**Step 2: Rodar typecheck e lint**

```bash
cd frontend && npm run typecheck && npm run lint
```

**Step 3: Testar build de produção**

```bash
cd frontend && npm run build
```
Expected: build sem erros

**Step 4: Se tudo OK, commit final**

```bash
git add -f frontend/
git commit -m "test: ensure full test coverage after clinical redesign"
```

---

## Task 15: Teste manual e ajustes visuais

**Files:** Possivelmente `index.css`, componentes novos — ajustes finos.

**Step 1: Subir dev server**

```bash
cd frontend && npm run dev
```

**Step 2: Testar o fluxo completo**

1. Abrir http://localhost:5173
2. Colar um texto de exemplo (usar botão "Exemplo de relato")
3. Clicar "Processar"
4. Verificar:
   - Dashboard aparece com radar chart
   - Resumo em linguagem natural visível
   - Pills de domínio clicáveis
   - Click em domínio → expande DomainDetail inline
   - Click em finding → expande evidência inline
   - Gaps mostram perguntas sugeridas
   - "Inserir na narrativa" funciona
   - Histórico funciona
   - Dark mode funciona

**Step 3: Ajustar CSS/espaçamentos conforme necessário**

Fazer ajustes visuais finos para garantir que o resultado é limpo e legível.

**Step 4: Commit final**

```bash
git add -f frontend/
git commit -m "style: visual polish for clinical dashboard redesign"
```

---

## Resumo de Dependências entre Tasks

```
Task 1 (recharts) ──────────────────────────────┐
Task 2 (radarData) ─────────────────────────────┤
Task 3 (theme/CSS) ─────────────────────────────┤
Task 4 (SummaryBanner) ────────────────────────┤
Task 5 (EvidenceInline) ──┐                     │
Task 6 (GapInsight) ──────┤                     │
                           ├─ Task 7 (DomainDetail)
                           │                     │
                           └─────────────────────┼─ Task 8 (ClinicalDashboard)
                                                 │
                                                 ├─ Task 9 (OutputPanel rewrite)
                                                 │
Task 10 (InputPanel simplify) ──────────────────┤
Task 11 (HistoryPanel simplify) ────────────────┤
                                                 │
                                                 ├─ Task 12 (App.tsx update)
                                                 ├─ Task 13 (cleanup old components)
                                                 ├─ Task 14 (full test suite)
                                                 └─ Task 15 (manual test + polish)
```

**Tasks paralelizáveis:** 1, 2, 3 podem rodar em paralelo. 4, 5, 6 podem rodar em paralelo. 10 e 11 podem rodar em paralelo.
