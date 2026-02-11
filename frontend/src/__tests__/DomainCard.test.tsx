import { screen } from '@testing-library/react';
import { vi } from 'vitest';

import { renderWithProviders } from './test-utils';
import { DomainCard } from '../components/DomainCard';

test('DomainCard renderiza para diferentes dominios sem quebrar', () => {
  const onOpenEvidence = vi.fn();
  const base = {
    domain_name: 'D',
    findings: [],
  };

  renderWithProviders(
    <>
      <DomainCard domain={{ ...base, domain_id: 'DOM_01' }} onOpenEvidence={onOpenEvidence} />
      <DomainCard domain={{ ...base, domain_id: 'DOM_02' }} onOpenEvidence={onOpenEvidence} />
      <DomainCard domain={{ ...base, domain_id: 'DOM_03' }} onOpenEvidence={onOpenEvidence} />
      <DomainCard domain={{ ...base, domain_id: 'OTHER' }} onOpenEvidence={onOpenEvidence} />
    </>,
  );

  expect(screen.getAllByText(/Sem achados mapeados/i).length).toBeGreaterThan(0);
});
