import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { STATUS_LABELS, STATUS_ORDER } from '@/domain/parcelStatus';
import { PARCEL_SORTS, PARCEL_SORT_LABELS, type ParcelListQuery } from '@/types/api';

export interface FilterState {
  status: string;
  pickupArea: string;
  deliveryArea: string;
  trackingCode: string;
  sort: string;
  limit: string;
}

export const EMPTY_FILTERS: FilterState = {
  status: '',
  pickupArea: '',
  deliveryArea: '',
  trackingCode: '',
  sort: 'createdAt:desc',
  limit: '20',
};

export function hasActiveFilters(filters: FilterState): boolean {
  return Boolean(filters.status || filters.pickupArea || filters.deliveryArea || filters.trackingCode);
}

/**
 * Turns the form state into a query object. Empty strings become `undefined`
 * so the API client drops them: `?status=` would be a 422, not "no filter".
 */
export function toQuery(filters: FilterState, page: number): ParcelListQuery {
  const trackingCode = filters.trackingCode.trim();
  return {
    status: (filters.status || undefined) as ParcelListQuery['status'],
    pickupArea: filters.pickupArea.trim() || undefined,
    deliveryArea: filters.deliveryArea.trim() || undefined,
    // The API requires 2-20 characters, so a single character is held back
    // rather than sent and rejected.
    trackingCode: trackingCode.length >= 2 ? trackingCode : undefined,
    sort: filters.sort as ParcelListQuery['sort'],
    page,
    limit: Number(filters.limit),
  };
}

export function ParcelFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onReset: () => void;
}) {
  const tracking = filters.trackingCode.trim();
  const trackingTooShort = tracking.length === 1;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Select
        label="Status"
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value="">All statuses</option>
        {STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </Select>

      <Input
        label="Tracking code"
        monospace
        placeholder="Partial, e.g. 8MYRS"
        value={filters.trackingCode}
        onChange={(e) => onChange({ trackingCode: e.target.value.toUpperCase() })}
        spellCheck={false}
        maxLength={20}
        error={trackingTooShort ? 'At least 2 characters' : undefined}
        hint={trackingTooShort ? undefined : 'Partial match, 2–20 characters'}
      />

      <Input
        label="Pickup area"
        placeholder="e.g. Gulshan"
        value={filters.pickupArea}
        onChange={(e) => onChange({ pickupArea: e.target.value })}
        hint="Exact area name, any case"
      />

      <Input
        label="Delivery area"
        placeholder="e.g. Dhanmondi"
        value={filters.deliveryArea}
        onChange={(e) => onChange({ deliveryArea: e.target.value })}
        hint="Exact area name, any case"
      />

      <Select label="Sort" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })}>
        {PARCEL_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {PARCEL_SORT_LABELS[sort]}
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-1.5">
        <Select
          label="Per page"
          value={filters.limit}
          onChange={(e) => onChange({ limit: e.target.value })}
        >
          {['10', '20', '50', '100'].map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </Select>
        {hasActiveFilters(filters) && (
          <Button variant="ghost" size="sm" onClick={onReset} className="-mt-1 self-start">
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
