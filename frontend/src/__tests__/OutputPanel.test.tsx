import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

// Mock recharts ResponsiveContainer for jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div className="recharts-responsive-container" style={{ width: 200, height: 200 }}>{children}</div>
    ),
  };
});

import type { NormalizeResponse } from '../api/types';
import { OutputPanel } from '../components/OutputPanel';
import { renderWithProviders } from './test-utils';

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
    {
      domain_id: 'D2',
      domain_name: 'Humor',
      findings: [
        { symptom: 'Irritabilidade', score: 0.8, negated: false, method: 'heuristic', evidence: [] },
      ],
    },
    {
      domain_id: 'D3',
      domain_name: 'Motor',
      findings: [],
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

  it('shows loading skeleton when loading', () => {
    renderWithProviders(<OutputPanel result={null} loading={true} />);
    expect(screen.getByText(/Analisando narrativa/)).toBeInTheDocument();
  });

  it('renders clinical dashboard when result is present', () => {
    renderWithProviders(<OutputPanel result={mockResult} loading={false} />);
    expect(screen.getByText(/Resumo de teste/)).toBeInTheDocument();
    expect(screen.getByText('Cognição')).toBeInTheDocument();
  });
});
