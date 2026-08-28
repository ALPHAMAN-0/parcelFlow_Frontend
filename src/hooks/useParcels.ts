import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as parcelsApi from '@/api/parcels';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthToken } from '@/hooks/useAuth';
import { isApiError } from '@/lib/ApiError';
import { STATUS_ORDER, type ParcelStatusValue } from '@/domain/parcelStatus';
import type { CreateParcelPayload, Paginated, Parcel, ParcelListQuery } from '@/types/api';

/**
 * A 4xx is a definite answer — retrying it just burns rate-limit budget. Only
 * network failures and 5xx are worth a second attempt, and the API client has
 * already made one for the cold-start case.
 */
function retryPolicy(failureCount: number, error: unknown): boolean {
  if (isApiError(error)) {
    if (error.status >= 400 && error.status < 500) return false;
    if (error.isNetwork) return failureCount < 1;
  }
  return failureCount < 1;
}

export function useParcels(query: ParcelListQuery, options?: { enabled?: boolean }) {
  const token = useAuthToken();
  return useQuery({
    queryKey: queryKeys.parcels.list(query),
    queryFn: ({ signal }) => parcelsApi.listParcels(query, token, signal),
    enabled: Boolean(token) && (options?.enabled ?? true),
    retry: retryPolicy,
    // Keeps the previous page on screen while the next one loads, instead of
    // collapsing the table to a spinner on every filter change.
    placeholderData: (previous) => previous as Paginated<Parcel> | undefined,
    staleTime: 15_000,
  });
}

/** Detail is keyed by tracking code: GET /parcels/<uuid> answers 422. */
export function useParcel(trackingCode: string | undefined, options?: { enabled?: boolean }) {
  const token = useAuthToken();
  return useQuery({
    queryKey: queryKeys.parcels.detail(trackingCode ?? ''),
    queryFn: ({ signal }) => parcelsApi.getParcelByTrackingCode(trackingCode!, token, signal),
    enabled: Boolean(token && trackingCode) && (options?.enabled ?? true),
    retry: retryPolicy,
    staleTime: 10_000,
  });
}

/**
 * One `total` per status, using limit=1 so the API returns a single row and the
 * count comes from `meta.total`. Five small reads, but exact — and /parcels is
 * not rate limited, unlike the tracking endpoint.
 */
export function useStatusCounts(enabled = true) {
  const token = useAuthToken();
  return useQuery({
    queryKey: ['parcels', 'status-counts'],
    enabled: Boolean(token) && enabled,
    retry: retryPolicy,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const results = await Promise.all(
        STATUS_ORDER.map((status) =>
          parcelsApi.listParcels({ status, limit: 1 }, token, signal).then((r) => [status, r.meta.total] as const),
        ),
      );
      const counts = Object.fromEntries(results) as Record<ParcelStatusValue, number>;
      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
      return { counts, total };
    },
  });
}

/** Invalidate every parcel cache plus the admin stats a change would move. */
function useParcelInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.parcels.all });
    void queryClient.invalidateQueries({ queryKey: ['parcels', 'status-counts'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
  };
}

export function useCreateParcel() {
  const token = useAuthToken();
  const invalidate = useParcelInvalidation();
  return useMutation({
    mutationFn: (payload: CreateParcelPayload) => parcelsApi.createParcel(payload, token),
    onSuccess: invalidate,
  });
}

export function useUpdateParcelStatus() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const invalidate = useParcelInvalidation();
  return useMutation({
    mutationFn: (vars: { id: string; status: ParcelStatusValue }) =>
      parcelsApi.updateParcelStatus(vars.id, vars.status, token),
    onSuccess: (parcel) => {
      // The response is the updated parcel, but without its history, so seed
      // the list caches and let the detail query refetch for the new row.
      queryClient.removeQueries({ queryKey: queryKeys.parcels.detail(parcel.trackingCode) });
      invalidate();
    },
  });
}

export function useAssignParcelStaff() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const invalidate = useParcelInvalidation();
  return useMutation({
    mutationFn: (vars: { id: string; staffId: string | null }) =>
      parcelsApi.assignParcelStaff(vars.id, vars.staffId, token),
    onSuccess: (parcel) => {
      queryClient.removeQueries({ queryKey: queryKeys.parcels.detail(parcel.trackingCode) });
      invalidate();
    },
  });
}
