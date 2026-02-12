import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Evidence } from '../api/types';
import { EvidenceInline } from '../components/EvidenceInline';
import { renderWithProviders } from './test-utils';

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
    expect(buttons.length).toBe(2);
  });

  it('renders empty message when no evidence', () => {
    renderWithProviders(<EvidenceInline evidence={[]} />);
    expect(screen.getByText(/sem trechos correspondentes/i)).toBeInTheDocument();
  });
});
