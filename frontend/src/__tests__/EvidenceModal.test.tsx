import { screen } from '@testing-library/react';

import { renderWithProviders } from './test-utils';
import { EvidenceModal } from '../components/EvidenceModal';

test('EvidenceModal renderiza evidencias e badge de negacao', () => {
  renderWithProviders(
    <EvidenceModal
      value={{
        title: 't',
        evidence: [{ quote: 'BBB', start: 4, end: 7 }],
        meta: { score: 0.9, method: 'heuristic', negated: true },
        sourceText: 'AAA BBB CCC',
      }}
      onClose={() => undefined}
    />,
  );

  expect(screen.getByText(/Negado/i)).toBeInTheDocument();
  expect(screen.getByText(/\u201cBBB\u201d/i)).toBeInTheDocument();
  expect(screen.getByText(/offsets: 4..7/i)).toBeInTheDocument();
  expect(screen.getByText(/AAA/i)).toBeInTheDocument();
  expect(screen.getByText(/CCC/i)).toBeInTheDocument();
});

test('EvidenceModal mostra fallback quando nao ha evidencias', () => {
  renderWithProviders(
    <EvidenceModal
      value={{
        title: 't',
        evidence: [],
        meta: { score: 0.4, method: 'embeddings', negated: false },
      }}
      onClose={() => undefined}
    />,
  );

  expect(screen.getByText(/Sem evidências registradas/i)).toBeInTheDocument();
  expect(screen.getByText(/Embeddings/i)).toBeInTheDocument();
});

test('EvidenceModal: quando offsets sao invalidos (end<=start), ainda mostra um recorte do texto', () => {
  renderWithProviders(
    <EvidenceModal
      value={{
        title: 't',
        evidence: [{ quote: 'Q', start: 5, end: 5 }],
        meta: { score: 0.5, method: 'heuristic', negated: false },
        sourceText: '0123456789',
      }}
      onClose={() => undefined}
    />,
  );

  expect(screen.getByText(/\u201cQ\u201d/i)).toBeInTheDocument();
  expect(screen.getByText(/0123456789/i)).toBeInTheDocument();
});
