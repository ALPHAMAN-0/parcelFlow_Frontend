import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/parcels/StatusBadge';
import { StatusStepper } from '@/components/parcels/StatusStepper';
import { StatusTimeline } from '@/components/parcels/StatusTimeline';
import { AdvanceStatusButton } from '@/components/parcels/AdvanceStatusButton';
import { AssignStaffControl } from '@/components/parcels/AssignStaffControl';
import { useParcel } from '@/hooks/useParcels';
import { useAuth } from '@/hooks/useAuth';
import { formatDateTime, formatRelative, pluralize } from '@/lib/format';
import { STATUS_DESCRIPTIONS, STATUS_LABELS, nextStatus } from '@/domain/parcelStatus';
import { isValidTrackingCode } from '@/domain/trackingCode';
import { isApiError } from '@/lib/ApiError';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-subtle)] py-2 last:border-b-0">
      <dt className="text-muted text-[11px] font-medium">{label}</dt>
      <dd className="min-w-0 text-right text-xs font-medium">{children}</dd>
    </div>
  );
}

/**
 * Keyed by tracking code, not id — GET /parcels/<uuid> is a 422, because the
 * single-segment GET route is the tracking-code lookup. That one request also
 * returns the full history, so this page needs nothing else.
 */
export function ParcelDetailPage() {
  const { trackingCode = '' } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();

  const malformed = trackingCode.length > 0 && !isValidTrackingCode(trackingCode);
  const { data: parcel, isLoading, isError, error, refetch, isFetching } = useParcel(
    malformed ? undefined : trackingCode,
  );

  const canAdvance = role === 'ADMIN' || role === 'DELIVERY_STAFF';
  const isAdmin = role === 'ADMIN';

  if (malformed) {
    return (
      <>
        <PageHeader title="Parcel" />
        <Card>
          <ErrorState
            error={
              new Error(
                `"${trackingCode}" is not a valid tracking code. They look like PF-XXXXX-XXXXX, using letters and digits that cannot be confused with each other.`,
              )
            }
            onRetry={() => navigate('/track')}
          />
        </Card>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Parcel" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="space-y-4 p-5">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </Card>
          <Card>
            <div className="space-y-3 p-5">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (isError || !parcel) {
    const notFound = isApiError(error) && error.status === 404;
    return (
      <>
        <PageHeader title="Parcel" />
        <Card>
          <ErrorState error={error} onRetry={notFound ? undefined : () => void refetch()} />
          {notFound && (
            <div className="flex justify-center gap-2 pb-6">
              <Link to="/parcels">
                <Button variant="secondary" size="sm">
                  Back to parcels
                </Button>
              </Link>
              <Link to="/track">
                <Button size="sm">Try another code</Button>
              </Link>
            </div>
          )}
        </Card>
      </>
    );
  }

  const next = nextStatus(parcel.status);
  const isMine = parcel.customerId === user?.id;
  const assignedToMe = parcel.assignedStaffId === user?.id;

  return (
    <>
      <PageHeader
        title="Parcel"
        description={
          <>
            {STATUS_DESCRIPTIONS[parcel.status]}{' '}
            {isMine && <span className="opacity-70">You created this parcel.</span>}
            {assignedToMe && <span className="opacity-70">This parcel is assigned to you.</span>}
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => void refetch()} loading={isFetching}>
              Refresh
            </Button>
            <Link to="/parcels">
              <Button variant="ghost" size="sm">
                All parcels
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Identity + progress */}
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-lg font-bold tracking-wider">{parcel.trackingCode}</h2>
                  <CopyButton value={parcel.trackingCode} />
                </div>
                <StatusBadge status={parcel.status} />
              </div>

              <div className="mt-6">
                <StatusStepper status={parcel.status} />
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          {(canAdvance || isAdmin) && (
            <Card>
              <CardHeader
                title="Actions"
                description={
                  next
                    ? `The flow is linear, so the only move available from ${STATUS_LABELS[parcel.status]} is ${STATUS_LABELS[next]}.`
                    : 'Delivered is a final status. Nothing further can be changed.'
                }
              />
              <CardBody className="space-y-4">
                {canAdvance && (
                  <div className="flex flex-wrap items-center gap-3">
                    <AdvanceStatusButton parcel={parcel} size="md" confirm onDone={() => void refetch()} />
                    {!next && (
                      <p className="text-muted text-xs">
                        This parcel completed its journey {formatRelative(parcel.updatedAt)}.
                      </p>
                    )}
                  </div>
                )}

                {isAdmin && parcel.status !== 'DELIVERED' && (
                  <div className="border-t border-[var(--border-subtle)] pt-4">
                    <p className="mb-2 text-xs font-medium">Assigned delivery staff</p>
                    <div className="max-w-xs">
                      <AssignStaffControl parcel={parcel} />
                    </div>
                    <p className="text-muted mt-1.5 text-[11px]">
                      Only users with the delivery staff role appear here. Choosing "Unassigned"
                      clears the assignment.
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Audit trail */}
          <Card>
            <CardHeader
              title="History"
              description={`${pluralize(parcel.history.length, 'recorded event')}, oldest first. This trail is append-only — nothing here is ever edited or deleted.`}
            />
            <StatusTimeline history={parcel.history} />
          </Card>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <Card as="aside">
            <CardHeader title="Details" />
            <CardBody className="pt-1">
              <dl>
                <DetailRow label="Sender">{parcel.senderName}</DetailRow>
                <DetailRow label="Receiver">{parcel.receiverName}</DetailRow>
                <DetailRow label="Pickup area">{parcel.pickupArea}</DetailRow>
                <DetailRow label="Delivery area">{parcel.deliveryArea}</DetailRow>
                <DetailRow label="Parcel type">{parcel.parcelType}</DetailRow>
                <DetailRow label="Customer">
                  {parcel.customer.name}
                  {isMine && <span className="text-muted ml-1 font-normal">(you)</span>}
                </DetailRow>
                <DetailRow label="Courier">
                  {parcel.assignedStaff ? (
                    <>
                      {parcel.assignedStaff.name}
                      {isAdmin && (
                        <span className="text-muted block text-[10px] font-normal">
                          {parcel.assignedStaff.email}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted italic">Not yet assigned</span>
                  )}
                </DetailRow>
                <DetailRow label="Created">
                  <span title={parcel.createdAt}>{formatDateTime(parcel.createdAt)}</span>
                  <span className="text-muted block text-[10px] font-normal">
                    {formatRelative(parcel.createdAt)}
                  </span>
                </DetailRow>
                <DetailRow label="Last updated">
                  <span title={parcel.updatedAt}>{formatDateTime(parcel.updatedAt)}</span>
                  <span className="text-muted block text-[10px] font-normal">
                    {formatRelative(parcel.updatedAt)}
                  </span>
                </DetailRow>
                <DetailRow label="Parcel id">
                  <span className="font-mono text-[10px] break-all">{parcel.id}</span>
                </DetailRow>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
