/**
 * Every TanStack Query key in one place, so invalidation after a mutation
 * cannot miss a cache by mistyping a key.
 */
import type { ParcelListQuery, UserListQuery } from '@/types/api';

export const queryKeys = {
  me: ['auth', 'me'] as const,
  health: ['health'] as const,

  parcels: {
    all: ['parcels'] as const,
    list: (query: ParcelListQuery) => ['parcels', 'list', query] as const,
    /** Detail is keyed by tracking code: GET /parcels/<uuid> is a 422. */
    detail: (trackingCode: string) => ['parcels', 'detail', trackingCode] as const,
    history: (id: string) => ['parcels', 'history', id] as const,
    statusCount: (status: string) => ['parcels', 'count', status] as const,
  },

  admin: {
    stats: ['admin', 'stats'] as const,
    users: (query: UserListQuery) => ['admin', 'users', query] as const,
    staff: ['admin', 'users', 'delivery-staff'] as const,
  },
} as const;
