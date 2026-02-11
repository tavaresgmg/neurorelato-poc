import { vi } from 'vitest';

import { ApiError, getHistory, getRun, normalize } from '../api/client';

test('normalize faz POST e retorna response quando ok', async () => {
  const mock = {
    request_id: '1',
    created_at: '2026-02-10T00:00:00Z',
    ontology: { version: 'mock-1', source: 'embedded-json' },
    input: { text_length: 3, was_anonymized: false },
    domains: [],
    gaps: [],
    summary: { text: null, generated_by: 'none' },
    warnings: [],
  };

  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'X-Request-ID': 'srv-1' }),
    json: async () => mock,
  }));

  const res = await normalize({ text: 'abc', options: { enable_anonymization: false } });
  expect(res.request_id).toBe('1');
  // @ts-expect-error vitest global
  expect(fetch).toHaveBeenCalledTimes(1);
  // @ts-expect-error vitest global
  const args = fetch.mock.calls[0] as any[];
  const body = JSON.parse(args[1].body as string);
  expect(body.options.enable_anonymization).toBe(false);
  expect(args[1].headers).toBeTruthy();
  // requestJson sempre manda X-Request-ID.
  expect(String((args[1].headers as any).get?.('X-Request-ID') || '')).toMatch(/pn-|-/);
});

test('normalize lança ApiError quando resposta nao ok', async () => {
  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async () => ({
    ok: false,
    status: 400,
    json: async () => ({ error: { code: 'INVALID_INPUT' } }),
  }));

  await expect(normalize({ text: 'abc' })).rejects.toBeInstanceOf(ApiError);
});

test('normalize: quando options nao sao enviadas, usa defaults (anon=true, embeddings=false)', async () => {
  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      request_id: '1',
      created_at: '2026-02-10T00:00:00Z',
      ontology: { version: 'mock-1', source: 'embedded-json' },
      input: { text_length: 3, was_anonymized: false },
      domains: [],
      gaps: [],
      summary: { text: null, generated_by: 'none' },
      warnings: [],
    }),
  }));

  await normalize({ text: 'abc' });

  // @ts-expect-error vitest global
  const args = fetch.mock.calls[0] as any[];
  const body = JSON.parse(args[1].body as string);
  expect(body.options.enable_anonymization).toBe(true);
  expect(body.options.enable_embeddings).toBe(false);
});

test('getHistory faz GET e retorna lista', async () => {
  const mock = [
    {
      request_id: 'req-1',
      created_at: '2026-02-10T00:00:00Z',
      text_length: 10,
      findings_count: 1,
      gaps_count: 2,
    },
  ];

  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => mock,
  }));

  const res = await getHistory(10);
  expect(res[0].request_id).toBe('req-1');
});

test('getHistory lança ApiError quando resposta nao ok', async () => {
  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: { code: 'INTERNAL_ERROR' } }),
  }));

  await expect(getHistory(10)).rejects.toBeInstanceOf(ApiError);
});

test('getRun faz GET e retorna response', async () => {
  const mock = {
    request_id: 'req-1',
    created_at: '2026-02-10T00:00:00Z',
    ontology: { version: 'mock-1', source: 'embedded-json' },
    input: { text_length: 3, was_anonymized: false },
    domains: [],
    gaps: [],
    summary: { text: null, generated_by: 'none' },
    warnings: [],
  };

  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => mock,
  }));

  const res = await getRun('req-1');
  expect(res.request_id).toBe('req-1');
});

test('getRun lança ApiError quando resposta nao ok', async () => {
  // @ts-expect-error vitest global
  globalThis.fetch = vi.fn(async () => ({
    ok: false,
    status: 404,
    json: async () => ({ error: { code: 'NOT_FOUND' } }),
  }));

  await expect(getRun('req-404')).rejects.toBeInstanceOf(ApiError);
});
