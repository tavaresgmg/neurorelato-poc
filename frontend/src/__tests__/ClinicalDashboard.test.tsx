import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';

// Mock recharts ResponsiveContainer — it requires a real DOM for dimension measurement
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div className="recharts-responsive-container" style={{ width: 200, height: 200 }}>
        {children}
      </div>
    ),
  };
});

import type { NormalizeResponse } from '../api/types';
import { ClinicalDashboard } from '../components/ClinicalDashboard';
import { renderWithProviders } from './test-utils';

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

  it('renders StatsRow with KPI labels', () => {
    renderWithProviders(<ClinicalDashboard result={mockResult} />);
    expect(screen.getByText('lacunas')).toBeInTheDocument();
    expect(screen.getByText('cobertura')).toBeInTheDocument();
  });

  it('renders domain cards for all domains including gaps', () => {
    renderWithProviders(<ClinicalDashboard result={mockResult} />);
    expect(screen.getByText('Interação Social')).toBeInTheDocument();
    expect(screen.getByText('TDAH')).toBeInTheDocument();
    expect(screen.getByText('Comportamento Repetitivo')).toBeInTheDocument();
  });

  it('expands domain detail when card is clicked', async () => {
    renderWithProviders(<ClinicalDashboard result={mockResult} />);
    const card = screen.getByText('Interação Social').closest('.pn-domain-card')!;
    await userEvent.click(card);
    expect(screen.getByText('Contato visual reduzido')).toBeInTheDocument();
  });

  it('shows gap domain cards with gap styling', () => {
    renderWithProviders(<ClinicalDashboard result={mockResult} />);
    const gapCard = screen.getByText('Comportamento Repetitivo').closest('.pn-domain-card');
    expect(gapCard?.className).toContain('pn-domain-card--gap');
  });

  it('shows findings info in domain cards', () => {
    renderWithProviders(<ClinicalDashboard result={mockResult} />);
    expect(screen.getByText('2 achados')).toBeInTheDocument();
    expect(screen.getByText('1 achados')).toBeInTheDocument();
  });
});
