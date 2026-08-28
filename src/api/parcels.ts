import { request, requestList } from '@/lib/apiClient';
import { normalizeTrackingCode } from '@/domain/trackingCode';
import type { ParcelStatusValue } from '@/domain/parcelStatus';
import type {
  CreateParcelPayload,
  Paginated,
  Parcel,
  ParcelHistoryResponse,
  ParcelListQuery,
  ParcelWithHistory,
} from '@/types/api';

/** POST /parcels — customer or admin. Creates in PENDING. */
export function createParcel(payload: CreateParcelPayload, token: string): Promise<Parcel> {
  return request<Parcel>('/parcels', {
    method: 'POST',
    token,
    // Trimmed here as well as by the API, so the client-side length checks and
    // the server's see the same string.
    body: {
      senderName: payload.senderName.trim(),
      receiverName: payload.receiverName.trim(),
      pickupArea: payload.pickupArea.trim(),
      deliveryArea: payload.deliveryArea.trim(),
      parcelType: payload.parcelType.trim(),
    },
    retryOnColdStart: false, // a retry could create a second parcel
  });
}

/**
 * GET /parcels — scoped by role inside the API (customer: own, staff:
 * assigned, admin: all). buildQueryString drops empty values, which is what
 * keeps an unset filter from becoming a 422.
 */
export function listParcels(
  query: ParcelListQuery,
  token: string,
  signal?: AbortSignal,
): Promise<Paginated<Parcel>> {
  return requestList<Parcel>('/parcels', {
    token,
    signal,
    query: {
      status: query.status,
      deliveryArea: query.deliveryArea,
      pickupArea: query.pickupArea,
      trackingCode: query.trackingCode ? normalizeTrackingCode(query.trackingCode) : undefined,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    },
  });
}

/**
 * GET /parcels/:trackingCode — returns the parcel *and* its full history, so
 * the detail page needs only this one request.
 *
 * Rate limited to 60/min per IP. Not found and not-visible-to-you both answer
 * 404 PARCEL_NOT_FOUND, deliberately.
 */
export function getParcelByTrackingCode(
  trackingCode: string,
  token: string,
  signal?: AbortSignal,
): Promise<ParcelWithHistory> {
  return request<ParcelWithHistory>(`/parcels/${encodeURIComponent(normalizeTrackingCode(trackingCode))}`, {
    token,
    signal,
  });
}

/** GET /parcels/:id/history — for when a UUID is all we hold. Oldest first. */
export function getParcelHistory(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<ParcelHistoryResponse> {
  return request<ParcelHistoryResponse>(`/parcels/${encodeURIComponent(id)}/history`, { token, signal });
}

/** PATCH /parcels/:id/status — delivery staff (own only) or admin. */
export function updateParcelStatus(
  id: string,
  status: ParcelStatusValue,
  token: string,
): Promise<Parcel> {
  return request<Parcel>(`/parcels/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    token,
    body: { status },
    retryOnColdStart: false,
  });
}

/** PATCH /parcels/:id/assign — admin only. null clears the assignment. */
export function assignParcelStaff(
  id: string,
  staffId: string | null,
  token: string,
): Promise<Parcel> {
  return request<Parcel>(`/parcels/${encodeURIComponent(id)}/assign`, {
    method: 'PATCH',
    token,
    body: { staffId },
    retryOnColdStart: false,
  });
}
