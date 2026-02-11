import type { HistoryItem, NormalizeRequest, NormalizeResponse } from './types';

export class ApiError extends Error {
  public readonly status: number;
  public readonly body?: unknown;
  public readonly requestId?: string;

  constructor(message: string, status: number, body?: unknown, requestId?: string) {
    super(message);
    this.status = status;
    this.body = body;
    this.requestId = requestId;
  }
}

function makeRequestId(): string {
  try {
    // Browser.
    if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // Ignore.
  }
  // Fallback (tests/node).
  return `pn-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

async function requestJson<T>(url: string, init: RequestInit, errMsg: string): Promise<T> {
  const requestId = makeRequestId();
  const headers = new Headers(init.headers);
  headers.set('X-Request-ID', requestId);

  const res = await fetch(url, { ...init, headers });
  // In tests we often mock fetch with a plain object; be defensive.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hdr: any = (res as any).headers;
  const headerReqId = typeof hdr?.get === 'function' ? String(hdr.get('X-Request-ID') || '') : '';
  const responseRequestId = headerReqId || requestId;

  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new ApiError(`${errMsg} (req: ${responseRequestId})`, res.status, data, responseRequestId);
  }
  return data as T;
}

export async function normalize(payload: NormalizeRequest): Promise<NormalizeResponse> {
  return requestJson<NormalizeResponse>('/api/v1/normalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: payload.text,
      options: {
        enable_anonymization: payload.options?.enable_anonymization ?? true,
        enable_embeddings: payload.options?.enable_embeddings ?? false,
      },
    }),
  }, 'Falha ao processar texto');
}

export async function getHistory(limit = 20): Promise<HistoryItem[]> {
  return requestJson<HistoryItem[]>(
    `/api/v1/history?limit=${encodeURIComponent(String(limit))}`,
    { method: 'GET' },
    'Falha ao carregar histórico',
  );
}

export async function getRun(id: string): Promise<NormalizeResponse> {
  return requestJson<NormalizeResponse>(
    `/api/v1/runs/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Falha ao carregar consulta',
  );
}
