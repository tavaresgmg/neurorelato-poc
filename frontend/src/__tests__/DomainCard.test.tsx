import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from './test-utils';
import { DomainCard } from '../components/DomainCard';
import type { RadarDataPoint } from '../lib/radarData';

const basePoint: RadarDataPoint = {
  domain: 'Cognição',
  domainId: 'cognition',
  coverage: 85,
  isGap: false,
  gapLevel: 'none',
  findingsCount: 4,
};

const gapOnlyPoint: RadarDataPoint = {
  domain: 'Linguagem',
  domainId: 'language',
  coverage: 0,
  isGap: true,
  gapLevel: 'high',
  findingsCount: 0,
};

const gapWithFindings: RadarDataPoint = {
  domain: 'Humor',
  domainId: 'mood',
  coverage: 50,
  isGap: true,
  gapLevel: 'medium',
  findingsCount: 2,
};

describe('DomainCard', () => {
  it('renderiza nome do domínio', () => {
    renderWithProviders(
      <DomainCard point={basePoint} isActive={false} onClick={() => {}} />,
    );
    expect(screen.getByText('Cognição')).toBeInTheDocument();
  });

  it('mostra coverage %', () => {
    renderWithProviders(
      <DomainCard point={basePoint} isActive={false} onClick={() => {}} />,
    );
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('chama onClick quando clicado', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(
      <DomainCard point={basePoint} isActive={false} onClick={onClick} />,
    );

    await user.click(screen.getByText('Cognição'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('aplica classe pn-domain-card--active quando isActive=true', () => {
    const { container } = renderWithProviders(
      <DomainCard point={basePoint} isActive={true} onClick={() => {}} />,
    );
    expect(container.querySelector('.pn-domain-card--active')).toBeInTheDocument();
  });

  it('aplica classe pn-domain-card--gap para gap-only domains', () => {
    const { container } = renderWithProviders(
      <DomainCard point={gapOnlyPoint} isActive={false} onClick={() => {}} />,
    );
    expect(container.querySelector('.pn-domain-card--gap')).toBeInTheDocument();
  });

  it('nao aplica classe pn-domain-card--gap quando tem findings', () => {
    const { container } = renderWithProviders(
      <DomainCard point={gapWithFindings} isActive={false} onClick={() => {}} />,
    );
    expect(container.querySelector('.pn-domain-card--gap')).not.toBeInTheDocument();
  });

  it('mostra contagem de achados', () => {
    renderWithProviders(
      <DomainCard point={basePoint} isActive={false} onClick={() => {}} />,
    );
    expect(screen.getByText('4 achados')).toBeInTheDocument();
  });

  it('mostra "lacuna" quando isGap=true', () => {
    renderWithProviders(
      <DomainCard point={gapWithFindings} isActive={false} onClick={() => {}} />,
    );
    expect(screen.getByText('lacuna')).toBeInTheDocument();
  });

  it('nao mostra "lacuna" quando isGap=false', () => {
    renderWithProviders(
      <DomainCard point={basePoint} isActive={false} onClick={() => {}} />,
    );
    expect(screen.queryByText('lacuna')).not.toBeInTheDocument();
  });

  it('tem a classe base pn-domain-card', () => {
    const { container } = renderWithProviders(
      <DomainCard point={basePoint} isActive={false} onClick={() => {}} />,
    );
    expect(container.querySelector('.pn-domain-card')).toBeInTheDocument();
  });

  it('renderiza RingProgress', () => {
    const { container } = renderWithProviders(
      <DomainCard point={basePoint} isActive={false} onClick={() => {}} />,
    );
    expect(container.querySelector('.mantine-RingProgress-root')).toBeInTheDocument();
  });
});
