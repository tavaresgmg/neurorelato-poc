import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { DomainResult, Gap } from '../api/types';
import { DomainDetail } from '../components/DomainDetail';
import { renderWithProviders } from './test-utils';

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

  it('renders all findings', () => {
    renderWithProviders(<DomainDetail domain={mockDomain} />);
    expect(screen.getByText('Evita contato visual')).toBeInTheDocument();
    expect(screen.getByText('Isolamento social')).toBeInTheDocument();
  });

  it('expands evidence on finding click', async () => {
    renderWithProviders(
      <DomainDetail domain={mockDomain} sourceText="...não olha nos olhos..." />,
    );
    await userEvent.click(screen.getByText('Evita contato visual'));
    expect(screen.getAllByText(/não olha nos olhos/).length).toBeGreaterThanOrEqual(1);
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
