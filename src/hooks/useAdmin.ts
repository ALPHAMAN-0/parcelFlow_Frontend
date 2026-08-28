import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '@/api/admin';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthToken } from '@/hooks/useAuth';
import { isApiError } from '@/lib/ApiError';
import type { Paginated, Role, User, UserListQuery } from '@/types/api';

function retryPolicy(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < 1;
}

export function useAdminStats(enabled = true) {
  const token = useAuthToken();
  return useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: ({ signal }) => adminApi.getStats(token, signal),
    enabled: Boolean(token) && enabled,
    retry: retryPolicy,
    staleTime: 30_000,
  });
}

export function useAdminUsers(query: UserListQuery, enabled = true) {
  const token = useAuthToken();
  return useQuery({
    queryKey: queryKeys.admin.users(query),
    queryFn: ({ signal }) => adminApi.listUsers(query, token, signal),
    enabled: Boolean(token) && enabled,
    retry: retryPolicy,
    placeholderData: (previous) => previous as Paginated<User> | undefined,
    staleTime: 15_000,
  });
}

/** Delivery staff for the assignment dropdown. limit=100 is the API's ceiling. */
export function useDeliveryStaff(enabled = true) {
  const token = useAuthToken();
  return useQuery({
    queryKey: queryKeys.admin.staff,
    queryFn: ({ signal }) =>
      adminApi.listUsers({ role: 'DELIVERY_STAFF', limit: 100 }, token, signal),
    enabled: Boolean(token) && enabled,
    retry: retryPolicy,
    staleTime: 300_000,
    select: (data) => data.items,
  });
}

export function useUpdateUserRole() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; role: Role }) =>
      adminApi.updateUserRole(vars.id, vars.role, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
      // A demotion releases parcels, so the parcel lists are stale too.
      void queryClient.invalidateQueries({ queryKey: queryKeys.parcels.all });
    },
  });
}
