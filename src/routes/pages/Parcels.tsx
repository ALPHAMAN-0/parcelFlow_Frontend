import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { ParcelTable } from '@/components/parcels/ParcelTable';
import { ParcelCard } from '@/components/parcels/ParcelCard';
import {
  EMPTY_FILTERS,
  ParcelFilters,
  hasActiveFilters,
  toQuery,
  type FilterState,
} from '@/components/parcels/ParcelFilters';
import { useParcels } from '@/hooks/useParcels';
import { useAuth } from '@/hooks/useAuth';
import { useDebounced } from '@/hooks/useDebounced';

const SCOPE_NOTE: Record<string, string> = {
  CUSTOMER: 'You see the parcels you created.',
  DELIVERY_STAFF: 'You see the parcels assigned to you.',
  ADMIN: 'You see every parcel in the system.',
};

/**
 * Filters live in the URL, so a filtered view is shareable and the back button
 * steps through filter changes rather than leaving the page.
 */
export function ParcelsPage() {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: FilterState = {
    status: searchParams.get('status') ?? '',
    pickupArea: searchParams.get('pickupArea') ?? '',
    deliveryArea: searchParams.get('deliveryArea') ?? '',
    trackingCode: searchParams.get('trackingCode') ?? '',
    sort: searchParams.get('sort') ?? EMPTY_FILTERS.sort,
    limit: searchParams.get('limit') ?? EMPTY_FILTERS.limit,
  };
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

  // Text filters are debounced so typing an area name is one request, not eight.
  const debouncedText = useDebounced(
    `${filters.pickupArea}|${filters.deliveryArea}|${filters.trackingCode}`,
    400,
  );

  const query = useMemo(() => {
    const [pickupArea, deliveryArea, trackingCode] = debouncedText.split('|');
    return toQuery({ ...filters, pickupArea, deliveryArea, trackingCode }, page);
    // filters.status/sort/limit apply immediately; the text fields come from the
    // debounced value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText, filters.status, filters.sort, filters.limit, page]);

  const { data, isLoading, isFetching, isError, error, refetch } = useParcels(query);

  function update(next: Partial<FilterState>) {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      // Defaults and empties stay out of the URL, keeping it readable.
      if (!value) continue;
      if (key === 'sort' && value === EMPTY_FILTERS.sort) continue;
      if (key === 'limit' && value === EMPTY_FILTERS.limit) continue;
      params.set(key, value);
    }
    // Any filter change resets to page 1: page 4 of the old result set is
    // meaningless against the new one.
    setSearchParams(params, { replace: true });
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  const parcels = data?.items ?? [];
  const filtered = hasActiveFilters(filters);

  return (
    <>
      <PageHeader
        title="Parcels"
        description={role ? SCOPE_NOTE[role] : undefined}
        actions={
          (role === 'CUSTOMER' || role === 'ADMIN') && (
            <Link to="/parcels/new">
              <Button size="sm">New parcel</Button>
            </Link>
          )
        }
      />

      <Card className="mb-4">
        <div className="p-4">
          <ParcelFilters filters={filters} onChange={update} onReset={reset} />
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <SkeletonRows rows={6} cols={5} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : parcels.length === 0 ? (
          <EmptyState
            title={filtered ? 'No parcels match these filters' : 'No parcels yet'}
            description={
              filtered
                ? 'Area filters match the whole name exactly (case does not matter), and a tracking-code search needs at least 2 characters.'
                : role === 'DELIVERY_STAFF'
                  ? 'Nothing is assigned to you yet. An admin assigns parcels to delivery staff.'
                  : 'Create your first parcel and it will appear here with a tracking code.'
            }
            action={
              filtered ? (
                <Button variant="secondary" size="sm" onClick={reset}>
                  Clear filters
                </Button>
              ) : role === 'CUSTOMER' || role === 'ADMIN' ? (
                <Link to="/parcels/new">
                  <Button size="sm">Create a parcel</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Fetching an updated page keeps the old rows visible, dimmed. */}
            <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <div className="hidden sm:block">
                <ParcelTable parcels={parcels} role={role!} />
              </div>
              <div className="sm:hidden">
                {parcels.map((parcel) => (
                  <ParcelCard key={parcel.id} parcel={parcel} role={role!} />
                ))}
              </div>
            </div>
            {data && <Pagination meta={data.meta} onPageChange={goToPage} isLoading={isFetching} />}
          </>
        )}
      </Card>
    </>
  );
}
