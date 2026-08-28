import { request, requestList } from '@/lib/apiClient';
import type { AdminStats, Paginated, Role, RoleChangeResult, User, UserListQuery } from '@/types/api';

/** GET /admin/stats — every figure computed in the database. */
export function getStats(token: string, signal?: AbortSignal): Promise<AdminStats> {
  return request<AdminStats>('/admin/stats', { token, signal });
}

/** GET /admin/users — `search` matches name or email, case-insensitive. */
export function listUsers(
  query: UserListQuery,
  token: string,
  signal?: AbortSignal,
): Promise<Paginated<User>> {
  return requestList<User>('/admin/users', {
    token,
    signal,
    query: {
      role: query.role,
      search: query.search,
      page: query.page,
      limit: query.limit,
    },
  });
}

/**
 * PATCH /admin/users/:id/role.
 *
 * Demoting a delivery staff member also releases their undelivered parcels, in
 * the same transaction; the count comes back as `releasedParcels`. Acting on
 * yourself is a 409 CANNOT_CHANGE_OWN_ROLE.
 */
export function updateUserRole(id: string, role: Role, token: string): Promise<RoleChangeResult> {
  return request<RoleChangeResult>(`/admin/users/${encodeURIComponent(id)}/role`, {
    method: 'PATCH',
    token,
    body: { role },
    retryOnColdStart: false,
  });
}
