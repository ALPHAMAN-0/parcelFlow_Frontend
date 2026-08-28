import { request } from '@/lib/apiClient';

export interface ShallowHealth {
  status: string;
  uptimeSeconds: number;
}

/** Never touches the database, so it is safe to poll. */
export function getHealth(signal?: AbortSignal): Promise<ShallowHealth> {
  return request<ShallowHealth>('/health', { signal });
}

/** Queries the database too; answers 503 when it is unreachable. */
export function getDbHealth(signal?: AbortSignal): Promise<{ status: string; database: string }> {
  return request<{ status: string; database: string }>('/health/db', { signal });
}
