import { screen } from '@testing-library/react';

import { renderWithProviders } from './test-utils';
import { GapsPanel } from '../components/GapsPanel';

test('GapsPanel renderiza lacunas ordenadas por severidade', () => {
  renderWithProviders(
    <GapsPanel
      gaps={[
        {
          domain_id: 'D1',
          domain_name: 'Domínio A',
          gap_level: 'low',
          rationale: 'r1',
          suggested_questions: ['p1'],
        },
        {
          domain_id: 'D2',
          domain_name: 'Domínio B',
          gap_level: 'high',
          rationale: 'r2',
          suggested_questions: ['p2'],
        },
      ]}
    />,
  );

  expect(screen.getByText(/^Lacunas$/i)).toBeInTheDocument();
  expect(screen.getByText('Domínio B')).toBeInTheDocument();
  expect(screen.getByText('Domínio A')).toBeInTheDocument();

  // high deve vir antes de low no DOM
  const items = screen.getAllByText(/^Domínio [AB]$/i);
  expect(items[0]).toHaveTextContent('Domínio B');
  expect(items[1]).toHaveTextContent('Domínio A');
});

test('GapsPanel mostra perguntas sugeridas', () => {
  renderWithProviders(
    <GapsPanel
      gaps={[
        {
          domain_id: 'D1',
          domain_name: 'X',
          gap_level: 'medium',
          rationale: 'r',
          suggested_questions: ['Há insistência em rotinas?'],
        },
      ]}
    />,
  );

  expect(screen.getByText(/Há insistência em rotinas\?/i)).toBeInTheDocument();
});
