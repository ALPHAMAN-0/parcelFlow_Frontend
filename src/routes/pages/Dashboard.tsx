import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCards, SkeletonRows } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBreakdown } from '@/components/admin/StatusBreakdown';
import { StatusBadge } from '@/components/parcels/StatusBadge';
import { AdvanceStatusButton } from '@/components/parcels/AdvanceStatusButton';
import { useParcels, useStatusCounts } from '@/hooks/useParcels';
import { useAdminStats } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { formatHours, formatNumber, formatPercent, formatRelative } from '@/lib/format';
import { STATUS_LABELS, nextStatus } from '@/domain/parcelStatus';

/** Recent activity, shared by all three roles (each already scoped by the API). */
function RecentParcels({ title, description }: { title: string; description: string }) {
  const { data, isLoading, isError, error, refetch } = useParcels({ limit: 5, sort: 'updatedAt:desc' });

  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        actions={
          <Link to="/parcels">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        }
      />
      {isLoading ? (
        <SkeletonRows rows={4} cols={3} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="Nothing here yet" description="Parcels appear as soon as there are any." />
      ) : (
        <ul>
          {data!.items.map((parcel) => (
            <li
              key={parcel.id}
              className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <Link
                  to={`/parcels/${parcel.trackingCode}`}
                  className="text-brand-600 dark:text-brand-400 font-mono text-xs font-semibold hover:underline"
                >
                  {parcel.trackingCode}
                </Link>
                <p className="text-muted mt-0.5 truncate text-[11px]">
                  {parcel.pickupArea} → {parcel.deliveryArea} · {formatRelative(parcel.updatedAt)}
                </p>
              </div>
              <StatusBadge status={parcel.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Counts come from meta.total on five limit=1 reads, so they are exact. */
function StatusCountCards() {
  const { data, isLoading, isError, error, refetch } = useStatusCounts();

  if (isLoading) return <SkeletonCards count={5} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { counts, total } = data!;
  const inFlight = counts.PICKED_UP + counts.IN_TRANSIT + counts.OUT_FOR_DELIVERY;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total parcels" value={formatNumber(total)} to="/parcels" />
        <StatCard
          label="Awaiting pickup"
          value={formatNumber(counts.PENDING)}
          tone={counts.PENDING > 0 ? 'warning' : 'neutral'}
          to="/parcels?status=PENDING"
        />
        <StatCard label="In flight" value={formatNumber(inFlight)} hint="Picked up through out for delivery" />
        <StatCard
          label="Delivered"
          value={formatNumber(counts.DELIVERED)}
          tone="positive"
          to="/parcels?status=DELIVERED"
        />
      </div>

      <Card className="mt-4">
        <CardHeader title="By status" description="Click a row to filter the parcel list." />
        <CardBody>
          <StatusBreakdown byStatus={counts} total={total} />
        </CardBody>
      </Card>
    </>
  );
}

/** Staff work queue: everything not yet delivered, oldest activity first. */
function StaffQueue() {
  const { data, isLoading, isError, error, refetch } = useParcels({
    limit: 100,
    sort: 'updatedAt:asc',
  });

  const pending = (data?.items ?? []).filter((p) => nextStatus(p.status) !== null).slice(0, 6);

  return (
    <Card>
      <CardHeader
        title="Your next actions"
        description="Parcels assigned to you that still need a step. Longest untouched first."
      />
      {isLoading ? (
        <SkeletonRows rows={4} cols={3} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : pending.length === 0 ? (
        <EmptyState
          title="Nothing waiting on you"
          description="Every parcel assigned to you has been delivered. New assignments show up here."
        />
      ) : (
        <ul>
          {pending.map((parcel) => (
            <li
              key={parcel.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <Link
                  to={`/parcels/${parcel.trackingCode}`}
                  className="text-brand-600 dark:text-brand-400 font-mono text-xs font-semibold hover:underline"
                >
                  {parcel.trackingCode}
                </Link>
                <p className="text-muted mt-0.5 truncate text-[11px]">
                  {STATUS_LABELS[parcel.status]} · {parcel.pickupArea} → {parcel.deliveryArea} ·
                  updated {formatRelative(parcel.updatedAt)}
                </p>
              </div>
              <AdvanceStatusButton parcel={parcel} confirm />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AdminOverview() {
  const { data: stats, isLoading, isError, error, refetch } = useAdminStats();

  if (isLoading) return <SkeletonCards count={4} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!stats) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total parcels" value={formatNumber(stats.parcels.total)} to="/parcels" />
      <StatCard
        label="Unassigned"
        value={formatNumber(stats.parcels.unassigned)}
        hint="Undelivered with no courier"
        tone={stats.parcels.unassigned > 0 ? 'warning' : 'neutral'}
        to="/parcels?status=PENDING"
      />
      <StatCard
        label="Delivery rate"
        value={formatPercent(stats.parcels.deliveryRate)}
        hint={`${formatNumber(stats.delivery.deliveredCount)} delivered`}
        tone="positive"
      />
      <StatCard
        label="Avg time to deliver"
        value={formatHours(stats.delivery.averageHoursToDeliver)}
        hint="Creation to delivered"
      />
    </div>
  );
}

export function DashboardPage() {
  const { user, role } = useAuth();
  const firstName = user?.name.split(' ')[0] ?? 'there';

  if (role === 'ADMIN') {
    return (
      <>
        <PageHeader
          title={`Welcome back, ${firstName}`}
          description="A snapshot of the whole system. Full figures are on the statistics page."
          actions={
            <Link to="/admin/stats">
              <Button size="sm">Full statistics</Button>
            </Link>
          }
        />
        <AdminOverview />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <RecentParcels title="Recently updated" description="The last five parcels to change, across all customers." />
          <Card>
            <CardHeader title="Quick actions" />
            <CardBody className="space-y-2">
              {[
                { to: '/parcels?status=PENDING', label: 'Assign pending parcels', hint: 'Give a courier to what is waiting' },
                { to: '/admin/users?role=DELIVERY_STAFF', label: 'Manage delivery staff', hint: 'Promote, demote, review' },
                { to: '/parcels/new', label: 'Create a parcel', hint: 'On behalf of a customer' },
                { to: '/admin/stats', label: 'Delivery statistics', hint: 'Rates, areas, averages' },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:surface-sunken"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-medium">{action.label}</span>
                    <span className="text-muted block text-[11px]">{action.hint}</span>
                  </span>
                  <svg viewBox="0 0 24 24" className="text-muted size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  if (role === 'DELIVERY_STAFF') {
    return (
      <>
        <PageHeader
          title={`Welcome back, ${firstName}`}
          description="Your assigned deliveries. You see only the parcels assigned to you."
        />
        <StatusCountCards />
        <div className="mt-4">
          <StaffQueue />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your parcels and where they have got to."
        actions={
          <Link to="/parcels/new">
            <Button size="sm">New parcel</Button>
          </Link>
        }
      />
      <StatusCountCards />
      <div className="mt-4">
        <RecentParcels title="Recent activity" description="Your five most recently updated parcels." />
      </div>
    </>
  );
}
