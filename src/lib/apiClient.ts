/**
 * The only place in the app that knows about HTTP, the response envelope, or
 * the API's base URL. Everything else calls the typed wrappers in src/api/.
 */
import { API_BASE_URL, COLD_START_TIMEOUT_MS, REQUEST_TIMEOUT_MS } from './config';
import { ApiError, CLIENT_ERROR_CODES, type ApiErrorDetails } from './ApiError';
import type { PaginationMeta } from '@/types/api';

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  /** Retry once on a network failure with a long timeout. On for GETs. */
  retryOnColdStart?: boolean;
}

export interface Envelope<T> {
  data: T;
  meta?: PaginationMeta;
}

// --- session-expiry notification -------------------------------------------
// AuthProvider registers a listener; the client stays free of React.

type UnauthorizedHandler = (err: ApiError) => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

// --- cold-start notification -----------------------------------------------
// Render's free tier sleeps after ~15 min idle. The first request then hangs
// for 30-60s. Rather than fail it, we surface a banner and wait.

type ColdStartListener = (waking: boolean) => void;
const coldStartListeners = new Set<ColdStartListener>();

export function onColdStart(listener: ColdStartListener): () => void {
  coldStartListeners.add(listener);
  return () => coldStartListeners.delete(listener);
}

function emitColdStart(waking: boolean): void {
  for (const listener of coldStartListeners) listener(waking);
}

/**
 * Serialises a query object, dropping undefined, null and ''.
 *
 * This is not a nicety. Every API schema is a Zod strictObject, so
 * `?status=` is a hard 422 ("Invalid option: expected one of PENDING|...")
 * rather than "no status filter". An empty filter must be absent, not empty.
 */
export function buildQueryString(query?: Record<string, QueryValue>): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    const asString = typeof value === 'string' ? value.trim() : String(value);
    if (asString === '') continue;
    params.set(key, asString);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Combines an external signal with our own timeout. */
function withTimeout(timeoutMs: number, external?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), timeoutMs);

  const onExternalAbort = () => controller.abort(external?.reason);
  if (external) {
    if (external.aborted) onExternalAbort();
    else external.addEventListener('abort', onExternalAbort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener('abort', onExternalAbort);
    },
  };
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // A Render 502 or a Cloudflare error page is HTML, not our envelope.
    return { __nonJson: text.slice(0, 300) };
  }
}

function isEnvelope(value: unknown): value is { success: boolean; data?: unknown; meta?: unknown; error?: unknown } {
  return typeof value === 'object' && value !== null && 'success' in value;
}

async function attempt<T>(
  path: string,
  options: RequestOptions,
  timeoutMs: number,
): Promise<Envelope<T>> {
  const { method = 'GET', body, token, query, signal: externalSignal } = options;
  const url = `${API_BASE_URL}${path}${buildQueryString(query)}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const { signal, cleanup } = withTimeout(timeoutMs, externalSignal);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      // Auth is a Bearer header, and the API answers
      // Access-Control-Allow-Origin: *, which forbids credentialed requests.
      credentials: 'omit',
      mode: 'cors',
    });
  } catch (err) {
    cleanup();
    if (externalSignal?.aborted) {
      throw new ApiError({ status: 0, code: CLIENT_ERROR_CODES.ABORTED, message: 'Request cancelled' });
    }
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    throw new ApiError({
      status: 0,
      code: timedOut ? CLIENT_ERROR_CODES.TIMEOUT : CLIENT_ERROR_CODES.NETWORK,
      message: timedOut
        ? `The API did not respond within ${Math.round(timeoutMs / 1000)}s.`
        : 'Could not reach the API. This is also what an ad blocker or privacy extension looks like — the browser reports ERR_BLOCKED_BY_CLIENT and fetch cannot tell the difference.',
    });
  }
  cleanup();

  const payload = await parseBody(res);

  if (!isEnvelope(payload)) {
    // Reached a server, but not ours — a proxy error page, most likely.
    throw new ApiError({
      status: res.status,
      code: res.ok ? CLIENT_ERROR_CODES.MALFORMED : `HTTP_${res.status}`,
      message: res.ok
        ? 'The API returned a response this client could not read.'
        : `The API gateway returned ${res.status} ${res.statusText || ''}`.trim(),
      requestId: res.headers.get('x-request-id') ?? undefined,
    });
  }

  if (!payload.success) {
    const error = (payload.error ?? {}) as {
      code?: string;
      message?: string;
      details?: ApiErrorDetails;
      requestId?: string;
    };
    const apiError = new ApiError({
      status: res.status,
      code: error.code ?? `HTTP_${res.status}`,
      message: error.message ?? 'The request failed.',
      details: error.details,
      requestId: error.requestId ?? res.headers.get('x-request-id') ?? undefined,
    });
    if (apiError.isSessionExpired()) onUnauthorized?.(apiError);
    throw apiError;
  }

  return { data: payload.data as T, meta: payload.meta as PaginationMeta | undefined };
}

/**
 * One request, with a single cold-start retry.
 *
 * The retry is deliberately narrow: only network-level failures (no reply at
 * all) and 502/503 from the gateway. A 422 or 409 is a real answer and must
 * never be retried — retrying a POST /parcels would create a second parcel.
 */
export async function requestEnvelope<T>(path: string, options: RequestOptions = {}): Promise<Envelope<T>> {
  const method = options.method ?? 'GET';
  const retry = options.retryOnColdStart ?? method === 'GET';

  try {
    return await attempt<T>(path, options, REQUEST_TIMEOUT_MS);
  } catch (err) {
    const isRetryable =
      err instanceof ApiError &&
      (err.isNetwork || err.status === 502 || err.status === 503) &&
      err.code !== CLIENT_ERROR_CODES.ABORTED;

    if (!retry || !isRetryable || options.signal?.aborted) throw err;

    emitColdStart(true);
    try {
      return await attempt<T>(path, options, COLD_START_TIMEOUT_MS);
    } finally {
      emitColdStart(false);
    }
  }
}

/** The common case: unwrap `data` and discard `meta`. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await requestEnvelope<T>(path, options)).data;
}

/** List endpoints: `data` is the array, `meta` carries the pagination. */
export async function requestList<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ items: T[]; meta: PaginationMeta }> {
  const { data, meta } = await requestEnvelope<T[]>(path, options);
  return {
    items: Array.isArray(data) ? data : [],
    meta: meta ?? { page: 1, limit: 20, total: Array.isArray(data) ? data.length : 0, totalPages: 1 },
  };
}
