/**
 * Types transcribed from the API's actual `select` shapes, not from its README.
 * Sources:
 *   publicUserSelect  — src/middleware/authenticate.js:6
 *   parcelSelect      — src/modules/parcels/parcels.service.js:9
 *   historySelect     — src/modules/parcels/parcels.service.js:26
 *   stats             — src/modules/admin/admin.service.js:48
 */
import type { ParcelStatusValue } from '@/domain/parcelStatus';

export const ROLES = ['CUSTOMER', 'DELIVERY_STAFF', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: 'Customer',
  DELIVERY_STAFF: 'Delivery staff',
  ADMIN: 'Admin',
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

/** Relations are expanded to a subset only — never the whole user row. */
export interface ParcelCustomerRef {
  id: string;
  name: string;
}

export interface ParcelStaffRef {
  id: string;
  name: string;
  email: string;
}

export interface Parcel {
  id: string;
  trackingCode: string;
  senderName: string;
  receiverName: string;
  pickupArea: string;
  deliveryArea: string;
  parcelType: string;
  status: ParcelStatusValue;
  customerId: string;
  assignedStaffId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: ParcelCustomerRef;
  assignedStaff: ParcelStaffRef | null;
}

export interface HistoryEntry {
  id: string;
  /** null on exactly one row per parcel: the creation record. */
  oldStatus: ParcelStatusValue | null;
  newStatus: ParcelStatusValue;
  createdAt: string;
  changedBy: { id: string; name: string; role: Role };
}

/** GET /parcels/:trackingCode returns the parcel *and* its history together. */
export interface ParcelWithHistory extends Parcel {
  history: HistoryEntry[];
}

/** GET /parcels/:id/history */
export interface ParcelHistoryResponse {
  parcelId: string;
  trackingCode: string;
  currentStatus: ParcelStatusValue;
  history: HistoryEntry[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface AuthResult {
  token: string;
  tokenType: string;
  expiresIn: string;
  user: User;
}

export interface AdminStats {
  parcels: {
    total: number;
    byStatus: Record<ParcelStatusValue, number>;
    unassigned: number;
    createdLast7Days: number;
    /** 0..1, rounded to three decimals. */
    deliveryRate: number;
  };
  users: {
    total: number;
    byRole: Record<Role, number>;
  };
  delivery: {
    deliveredCount: number;
    /** null when nothing has been delivered yet. */
    averageHoursToDeliver: number | null;
  };
  topDeliveryAreas: { deliveryArea: string; count: number }[];
  generatedAt: string;
}

export interface RoleChangeResult {
  user: User;
  previousRole: Role;
  /** Undelivered parcels released when a staff member was demoted. */
  releasedParcels: number;
}

// --- request payloads -------------------------------------------------------
// Every API schema is a Zod strictObject, so these must contain no extra keys.

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface CreateParcelPayload {
  senderName: string;
  receiverName: string;
  pickupArea: string;
  deliveryArea: string;
  parcelType: string;
}

export const PARCEL_SORTS = [
  'createdAt:desc',
  'createdAt:asc',
  'updatedAt:desc',
  'updatedAt:asc',
] as const;
export type ParcelSort = (typeof PARCEL_SORTS)[number];

export const PARCEL_SORT_LABELS: Record<ParcelSort, string> = {
  'createdAt:desc': 'Newest first',
  'createdAt:asc': 'Oldest first',
  'updatedAt:desc': 'Recently updated',
  'updatedAt:asc': 'Least recently updated',
};

export interface ParcelListQuery {
  status?: ParcelStatusValue;
  deliveryArea?: string;
  pickupArea?: string;
  /** Partial match, 2-20 characters. */
  trackingCode?: string;
  page?: number;
  limit?: number;
  sort?: ParcelSort;
}

export interface UserListQuery {
  role?: Role;
  search?: string;
  page?: number;
  limit?: number;
}
