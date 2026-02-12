import { screen } from '@testing-library/react';

import { renderWithProviders } from './test-utils';
import { StatsRow } from '../components/StatsRow';

const defaultProps = {
  totalFindings: 12,
  totalGaps: 3,
  overallCoverage: 75,
};

describe('StatsRow', () => {
  it('renders the 3 numeric values', () => {
    renderWithProviders(<StatsRow {...defaultProps} />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders labels "achados", "lacunas", "cobertura"', () => {
    renderWithProviders(<StatsRow {...defaultProps} />);
    expect(screen.getByText('achados')).toBeInTheDocument();
    expect(screen.getByText('lacunas')).toBeInTheDocument();
    expect(screen.getByText('cobertura')).toBeInTheDocument();
  });

  it('renders RingProgress for coverage', () => {
    const { container } = renderWithProviders(<StatsRow {...defaultProps} />);
    expect(container.querySelector('.mantine-RingProgress-root')).toBeInTheDocument();
  });

  it('renders zero values correctly', () => {
    renderWithProviders(<StatsRow totalFindings={0} totalGaps={0} overallCoverage={0} />);
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders 100% coverage', () => {
    renderWithProviders(<StatsRow totalFindings={5} totalGaps={0} overallCoverage={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
