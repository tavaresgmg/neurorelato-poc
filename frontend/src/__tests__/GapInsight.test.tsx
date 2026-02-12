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
  it('renders rationale', () => {
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

  it('renders nothing for gap_level none with no questions', () => {
    const noGap: Gap = { ...mockGap, gap_level: 'none', suggested_questions: [] };
    renderWithProviders(<GapInsight gap={noGap} />);
    expect(screen.queryByText(/Investigar/)).not.toBeInTheDocument();
  });
});
