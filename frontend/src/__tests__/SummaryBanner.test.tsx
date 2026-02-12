import { screen } from '@testing-library/react';

import { renderWithProviders } from './test-utils';
import { SummaryBanner } from '../components/SummaryBanner';

describe('SummaryBanner', () => {
  it('renders summary text', () => {
    renderWithProviders(<SummaryBanner text="Resumo clínico breve." />);
    expect(screen.getByText(/Resumo clínico breve/)).toBeInTheDocument();
  });

  it('renders nothing when text is null', () => {
    const { container } = renderWithProviders(<SummaryBanner text={null} />);
    expect(container.querySelector('.pn-summary-banner')).toBeNull();
  });

  it('shows copy button', () => {
    renderWithProviders(<SummaryBanner text="Resumo clínico." />);
    expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
  });

  it('wraps text in Spoiler with maxHeight constraint', () => {
    const longText = Array(50).fill('Linha de texto longo para ultrapassar o maxHeight.').join('\n');
    const { container } = renderWithProviders(<SummaryBanner text={longText} />);

    const spoilerRoot = container.querySelector('.mantine-Spoiler-root');
    expect(spoilerRoot).toBeInTheDocument();

    const spoilerContent = container.querySelector('.mantine-Spoiler-content');
    expect(spoilerContent).toBeInTheDocument();
    expect(spoilerContent).toHaveAttribute('role', 'region');
  });
});
