import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { HistoryPanel } from '../components/HistoryPanel';
import { renderWithProviders } from './test-utils';

function makeItem(
  id: string,
  findings: number,
  gaps: number,
  created_at = '2026-02-10T00:00:00Z',
) {
  return { request_id: id, created_at, text_length: 123, findings_count: findings, gaps_count: gaps };
}

test('HistoryPanel: mostra busca quando ha muitos itens e filtra por contagem', () => {
  const onOpenRun = vi.fn();
  renderWithProviders(
    <HistoryPanel
      history={[
        makeItem('a', 1, 0),
        makeItem('b', 2, 0),
        makeItem('c', 3, 1),
        makeItem('d', 4, 2),
      ]}
      loadingHistory={false}
      loadingRun={false}
      openingRunId={null}
      activeRunId={null}
      onRefresh={() => undefined}
      onOpenRun={onOpenRun}
    />,
  );

  const search = screen.getByPlaceholderText(/Buscar/i);
  fireEvent.change(search, { target: { value: '3 achados 1 lacunas' } });

  expect(screen.getByText(/3 achados · 1 lacunas/i)).toBeInTheDocument();
  expect(screen.queryByText(/4 achados · 2 lacunas/i)).not.toBeInTheDocument();
});

test('HistoryPanel: mostra mensagem quando busca nao retorna resultados', () => {
  renderWithProviders(
    <HistoryPanel
      history={[makeItem('a', 1, 0), makeItem('b', 2, 0), makeItem('c', 3, 1), makeItem('d', 4, 2)]}
      loadingHistory={false}
      loadingRun={false}
      openingRunId={null}
      activeRunId={null}
      onRefresh={() => undefined}
      onOpenRun={() => undefined}
    />,
  );

  fireEvent.change(screen.getByPlaceholderText(/Buscar/i), { target: { value: 'nao existe' } });
  expect(screen.getByText(/Nenhum resultado para/i)).toBeInTheDocument();
});

test('HistoryPanel: clicar em um item chama onOpenRun', () => {
  const onOpenRun = vi.fn();
  renderWithProviders(
    <HistoryPanel
      history={[makeItem('req-1', 1, 0)]}
      loadingHistory={false}
      loadingRun={false}
      openingRunId={null}
      activeRunId={null}
      onRefresh={() => undefined}
      onOpenRun={onOpenRun}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /1 achados/i }));
  expect(onOpenRun).toHaveBeenCalledWith('req-1');
});

test('HistoryPanel: durante loadingRun, desabilita itens que nao estao abrindo', () => {
  renderWithProviders(
    <HistoryPanel
      history={[makeItem('req-1', 1, 0), makeItem('req-2', 2, 1)]}
      loadingHistory={false}
      loadingRun={true}
      openingRunId={'req-1'}
      activeRunId={null}
      onRefresh={() => undefined}
      onOpenRun={() => undefined}
    />,
  );

  const b1 = screen.getByText(/1 achados · 0 lacunas/i).closest('button');
  const b2 = screen.getByText(/2 achados · 1 lacunas/i).closest('button');
  expect(b1).toBeTruthy();
  expect(b2).toBeTruthy();

  expect(b1).not.toBeDisabled();
  expect(b2).toBeDisabled();
});
