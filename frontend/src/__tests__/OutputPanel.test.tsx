import { screen } from '@testing-library/react';

import { renderWithProviders } from './test-utils';
import { OutputPanel } from '../components/OutputPanel';

test('OutputPanel: renderiza avisos e lacunas', () => {
  renderWithProviders(
    <OutputPanel
      result={{
        request_id: 'req-1',
        created_at: '2026-02-10T00:00:00Z',
        ontology: { version: 'mock-1', source: 'embedded-json' },
        input: { text_length: 1, was_anonymized: false },
        domains: [],
        gaps: [
          {
            domain_id: 'DOM_01',
            domain_name: 'X',
            gap_level: 'high',
            rationale: 'r',
            suggested_questions: ['q1'],
          },
        ],
        summary: { text: 's', generated_by: 'template' },
        warnings: [{ code: 'TEXT_TOO_SHORT', message: 'm' }],
      }}
      loading={false}
      onOpenEvidence={() => undefined}
    />,
  );

  expect(screen.getByText(/Avisos/i)).toBeInTheDocument();
  expect(screen.getByText(/^Lacunas$/i)).toBeInTheDocument();
  expect(screen.getByText(/TEXT_TOO_SHORT/i)).toBeInTheDocument();
});
