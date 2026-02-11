import { screen } from '@testing-library/react';
import { IconFileText } from '@tabler/icons-react';

import { renderWithProviders } from './test-utils';
import { EmptyState } from '../components/EmptyState';

test('EmptyState renderiza título, descrição e ícone', () => {
  renderWithProviders(
    <EmptyState
      icon={<IconFileText size={24} />}
      title="Nenhum resultado"
      description="Processa um texto para começar."
    />,
  );

  expect(screen.getByText('Nenhum resultado')).toBeInTheDocument();
  expect(screen.getByText('Processa um texto para começar.')).toBeInTheDocument();
});
