import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCards } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBreakdown } from '@/components/admin/StatusBreakdown';
import { RoleBreakdown } from '@/components/admin/RoleBreakdown';
import { TopAreas } from '@/components/admin/TopAreas';
import { useAdminStats } from '@/hooks/useAdmin';
import { formatDateTime, formatHours, formatNumber, formatPercent, formatRelative } from '@/lib/format';

export function AdminStatsPage() {
  const { data: stats, isLoading, isFetching, isError, error, refetch } = useAdminStats();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Statistics" />
        <SkeletonCards count={4} />
      </>
    );
  }

  if (isError || !stats) {
    return (
      <>
        <PageHeader title="Statistics" />
        <Card>
          <ErrorState error={error} onRetry={() => void refetch()} />
        </Card>
      </>
    );
  }

  const { parcels, users, delivery, topDeliveryAreas } = stats;
  const inFlight =
    parcels.byStatus.PICKED_UP + parcels.byStatus.IN_TRANSIT + parcels.byStatus.OUT_FOR_DELIVERY;

  return (
    <>
      <PageHeader
        title="Statistics"
        description={
          <>
            Every figure is computed in the database — nothing is counted in memory. Generated{' '}
            <time dateTime={stats.generatedAt} title={formatDateTime(stats.generatedAt)}>
              {formatRelative(stats.generatedAt)}
            </time>
            .
          </>
        }
        actions={
          <Button variant="secondary" size="sm" onClick={() => void refetch()} loading={isFetching}>
            Refresh
          </Button>
        }
      />

      {/* Parcel figures */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total parcels" value={formatNumber(parcels.total)} to="/parcels" />
        <StatCard
          label="Delivered"
          value={formatNumber(parcels.byStatus.DELIVERED)}
          hint={`${formatPercent(parcels.deliveryRate)} of all parcels`}
          tone="positive"
          to="/parcels?status=DELIVERED"
        />
        <StatCard label="In flight" value={formatNumber(inFlight)} hint="Picked up through out for delivery" />
        <StatCard
          label="Unassigned"
          value={formatNumber(parcels.unassigned)}
          hint="Undelivered, no courier yet"
          tone={parcels.unassigned > 0 ? 'warning' : 'neutral'}
          to="/parcels?status=PENDING"
        />
      </div>

      {/* Delivery performance */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Created last 7 days"
          value={formatNumber(parcels.createdLast7Days)}
          hint="Rolling window"
        />
        <StatCard
          label="Avg time to deliver"
          value={formatHours(delivery.averageHoursToDeliver)}
          hint={
            delivery.averageHoursToDeliver === null
              ? 'Nothing delivered yet'
              : 'From creation to the delivered event'
          }
        />
        <StatCard
          label="Delivery rate"
          value={formatPercent(parcels.deliveryRate)}
          hint="Delivered ÷ total"
          tone="positive"
        />
        <StatCard label="Total users" value={formatNumber(users.total)} to="/admin/users" />
      </div>

      {/* Breakdowns */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Parcels by status"
            description="Every status is listed, zeros included. Click a row to filter the parcel list."
          />
          <CardBody>
            <StatusBreakdown byStatus={parcels.byStatus} total={parcels.total} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Users by role"
            description="Click a role to filter the user list."
            actions={
              <Link to="/admin/users">
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            }
          />
          <CardBody>
            <RoleBreakdown byRole={users.byRole} total={users.total} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Top delivery areas"
            description="The five busiest destinations. Click one to filter the parcel list by it."
          />
          <CardBody>
            <TopAreas areas={topDeliveryAreas} />
          </CardBody>
        </Card>

        {parcels.unassigned > 0 && (
          <Card>
            <CardHeader title="Needs attention" />
            <CardBody>
              <p className="text-xs leading-relaxed">
                <span className="font-semibold">{formatNumber(parcels.unassigned)}</span> undelivered{' '}
                {parcels.unassigned === 1 ? 'parcel has' : 'parcels have'} no delivery staff assigned.
                Nothing can move out of Pending until a courier is assigned to it.
              </p>
              <Link to="/parcels?status=PENDING" className="mt-3 inline-block">
                <Button size="sm">Assign couriers</Button>
              </Link>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
