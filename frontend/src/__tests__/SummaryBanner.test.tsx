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
    expect(container.querySelector('.pn-summary-banner')).toBeNull();
  });

  it('hides gaps badge when zero', () => {
    renderWithProviders(
      <SummaryBanner text="Resumo." totalFindings={3} totalGaps={0} />,
    );
    expect(screen.queryByText(/lacunas/)).not.toBeInTheDocument();
  });

  it('shows copy button', () => {
    renderWithProviders(
      <SummaryBanner text="Resumo clínico." totalFindings={3} totalGaps={1} />,
    );
    expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
  });
});
