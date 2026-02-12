import { fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';

import App from '../App';
import { renderWithProviders } from './test-utils';

type MockSpeechInstance = {
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function installSpeechRecognitionMock() {
  let instance: MockSpeechInstance | null = null;

  class MockSR {
    lang = '';
    continuous = false;
    interimResults = false;
    onresult: ((ev: any) => void) | null = null;
    onerror: ((ev: any) => void) | null = null;
    onend: (() => void) | null = null;

    constructor() {
      instance = this;
    }

    start() {
      // noop
    }

    stop() {
      // noop
    }
  }

  // @ts-expect-error test override
  window.webkitSpeechRecognition = MockSR;

  return {
    getInstance: () => instance,
    cleanup: () => {
      // @ts-expect-error test cleanup
      delete window.webkitSpeechRecognition;
    },
  };
}

function mockOkResponse() {
  return {
    request_id: 'req-1',
    created_at: '2026-02-10T00:00:00Z',
    ontology: { version: 'mock-1', source: 'embedded-json' },
    input: { text_length: 10, was_anonymized: false },
    domains: [
      {
        domain_id: 'DOM_01',
        domain_name: 'Comunicação e Interação Social',
        findings: [
          {
            symptom: 'contato visual reduzido',
            score: 0.9,
            negated: false,
            method: 'heuristic',
            evidence: [{ quote: 'não olha nos olhos', start: 0, end: 16 }],
          },
        ],
      },
    ],
    gaps: [
      {
        domain_id: 'DOM_02',
        domain_name: 'Padrões Restritos e Repetitivos (Rigidez)',
        gap_level: 'high',
        rationale: 'Nenhuma evidência encontrada.',
        suggested_questions: ['Há insistência em rotinas específicas?'],
      },
    ],
    summary: { text: 'Resumo técnico (gerado automaticamente).', generated_by: 'template' },
    warnings: [],
  };
}

beforeEach(() => {
  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => [],
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('renderiza cabecalho e botao processar', async () => {
  renderWithProviders(<App />);
  expect(screen.getByText(/Normalização Semântica/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Processar/i })).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText(/Sem itens ainda/i)).toBeInTheDocument();
  });
});

test('sobre: abre modal com objetivos da PoC', async () => {
  renderWithProviders(<App />);

  fireEvent.click(screen.getByLabelText(/Sobre/i));
  expect(await screen.findByText(/O que esta PoC implementa/i)).toBeInTheDocument();
});

test('processa texto e renderiza achados e lacunas', async () => {
  const payload = mockOkResponse();

  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async (input: any, init?: any) => {
    const url = String(input);
    const method = String(init?.method || 'GET').toUpperCase();

    if (url.includes('/api/v1/history') && method === 'GET') {
      return { ok: true, status: 200, json: async () => [] };
    }
    if (url.includes('/api/v1/normalize') && method === 'POST') {
      return { ok: true, status: 200, json: async () => payload };
    }
    if (url.includes('/api/v1/runs/') && method === 'GET') {
      return { ok: true, status: 200, json: async () => payload };
    }

    return { ok: false, status: 404, json: async () => ({ error: { code: 'NOT_FOUND' } }) };
  });

  renderWithProviders(<App />);

  fireEvent.change(screen.getByPlaceholderText(/Cole aqui/i), {
    target: { value: 'texto de teste' },
  });

  fireEvent.click(screen.getByRole('button', { name: /Processar/i }));

  await waitFor(() => {
    expect(screen.getByText(/Comunicação e Interação Social/i)).toBeInTheDocument();
  });

  expect(screen.getByText(/Resumo técnico/i)).toBeInTheDocument();
  expect(screen.getAllByText(/1 achados/i).length).toBeGreaterThan(0);

  // Findings are inside collapsed DomainDetail -- click the domain pill to expand
  fireEvent.click(screen.getByText(/Comunicação e Interação Social/i));
  await waitFor(() => {
    expect(screen.getByText(/contato visual reduzido/i)).toBeInTheDocument();
  });

  // Gaps are shown as GapInsight within the domain detail (DOM_02 pill)
  fireEvent.click(screen.getByText(/Padrões Restritos/i));
  await waitFor(() => {
    expect(screen.getByText(/Há insistência em rotinas específicas\?/i)).toBeInTheDocument();
  });
});

test('audio desabilitado quando navegador nao suporta SpeechRecognition', async () => {
  renderWithProviders(<App />);

  const btn = screen.getByLabelText(/Iniciar áudio/i);
  expect(btn).toBeDisabled();
  await waitFor(() => {
    expect(screen.getByText(/Sem itens ainda/i)).toBeInTheDocument();
  });
});

test('carrega historico e abre um run salvo', async () => {
  const payload = mockOkResponse();
  const historyPayload = [
    {
      request_id: 'req-1',
      created_at: '2026-02-10T00:00:00Z',
      text_length: 10,
      findings_count: 1,
      gaps_count: 1,
    },
  ];

  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async (input: any, init?: any) => {
    const url = String(input);
    const method = String(init?.method || 'GET').toUpperCase();
    if (url.includes('/api/v1/history') && method === 'GET') {
      return { ok: true, status: 200, json: async () => historyPayload };
    }
    if (url.includes('/api/v1/runs/') && method === 'GET') {
      return { ok: true, status: 200, json: async () => payload };
    }
    return { ok: false, status: 404, json: async () => ({ error: { code: 'NOT_FOUND' } }) };
  });

  renderWithProviders(<App />);

  await waitFor(() => {
    expect(screen.getByText(/1 achados · 1 lacunas/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('button', { name: /1 achados/i }));

  await waitFor(() => {
    expect(screen.getByText(/Comunicação e Interação Social/i)).toBeInTheDocument();
  });
});

test('audio suportado: inicia, transcreve, usa transcricao e para', async () => {
  const speech = installSpeechRecognitionMock();
  try {
    renderWithProviders(<App />);

    const startBtn = screen.getByLabelText(/Iniciar áudio/i);
    expect(startBtn).toBeEnabled();
    await act(async () => {
      fireEvent.click(startBtn);
    });

    const instance = speech.getInstance();
    expect(instance).not.toBeNull();

    await act(async () => {
      instance?.onresult?.({
        results: [[{ transcript: 'primeira frase. ' }], [{ transcript: 'segunda.' }]],
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Usar transcrição/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Usar transcrição/i }));
    expect(screen.getByDisplayValue(/primeira frase/i)).toBeInTheDocument();

    const stopBtn = screen.getByLabelText(/Parar áudio/i);
    await act(async () => {
      fireEvent.click(stopBtn);
      instance?.onend?.();
    });
  } finally {
    speech.cleanup();
  }
});

test('renderiza achados com barras de confianca ao expandir dominio', async () => {
  const payload = mockOkResponse();
  payload.domains[0].findings = [
    {
      symptom: 's1',
      score: 0.9,
      negated: false,
      method: 'heuristic',
      evidence: [{ quote: 'e1', start: 0, end: 2 }],
    },
    {
      symptom: 's2',
      score: 0.7,
      negated: false,
      method: 'heuristic',
      evidence: [{ quote: 'e2', start: 0, end: 2 }],
    },
    {
      symptom: 's3',
      score: 0.4,
      negated: false,
      method: 'heuristic',
      evidence: [{ quote: 'e3', start: 0, end: 2 }],
    },
  ];

  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async (input: any, init?: any) => {
    const url = String(input);
    const method = String(init?.method || 'GET').toUpperCase();
    if (url.includes('/api/v1/history') && method === 'GET') {
      return { ok: true, status: 200, json: async () => [] };
    }
    if (url.includes('/api/v1/normalize') && method === 'POST') {
      return { ok: true, status: 200, json: async () => payload };
    }
    return { ok: false, status: 404, json: async () => ({ error: { code: 'NOT_FOUND' } }) };
  });

  renderWithProviders(<App />);

  fireEvent.change(screen.getByPlaceholderText(/Cole aqui/i), {
    target: { value: 'texto de teste' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Processar/i }));

  await waitFor(() => {
    expect(screen.getByText(/Comunicação e Interação Social/i)).toBeInTheDocument();
  });

  // Expand the domain to see findings
  fireEvent.click(screen.getByText(/Comunicação e Interação Social/i));
  await waitFor(() => {
    expect(screen.getByText(/s1/)).toBeInTheDocument();
  });

  expect(screen.getByText(/s2/)).toBeInTheDocument();
  expect(screen.getByText(/s3/)).toBeInTheDocument();

  // Confidence bars are rendered (not Alto/Medio/Baixo badges)
  const bars = document.querySelectorAll('.pn-confidence-bar-fill');
  expect(bars.length).toBe(3);
});

test('mostra notificacao quando API falha', async () => {
  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: { code: 'INTERNAL_ERROR' } }),
  }));

  renderWithProviders(<App />);

  fireEvent.change(screen.getByPlaceholderText(/Cole aqui/i), {
    target: { value: 'texto de teste' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Processar/i }));

  await waitFor(() => {
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toHaveTextContent('Falha ao processar');
  });
});
