import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { AdvanceStatusButton } from './AdvanceStatusButton';
import { AssignStaffControl } from './AssignStaffControl';
import { formatRelative } from '@/lib/format';
import { nextStatus } from '@/domain/parcelStatus';
import type { Parcel, Role } from '@/types/api';

/** Mobile view of the same row. */
export function ParcelCard({ parcel, role }: { parcel: Parcel; role: Role }) {
  const isAdmin = role === 'ADMIN';
  const canAdvance = role === 'ADMIN' || role === 'DELIVERY_STAFF';

  return (
    <div className="border-b border-[var(--border-subtle)] p-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/parcels/${parcel.trackingCode}`}
          className="text-brand-600 dark:text-brand-400 font-mono text-sm font-semibold tracking-wide hover:underline"
        >
          {parcel.trackingCode}
        </Link>
        <StatusBadge status={parcel.status} />
      </div>

      <p className="mt-2 text-xs">
        {parcel.pickupArea} <span className="text-muted">→</span> {parcel.deliveryArea}
      </p>
      <p className="text-muted mt-0.5 text-[11px]">
        {parcel.senderName} → {parcel.receiverName} · {parcel.parcelType}
      </p>

      <dl className="mt-3 space-y-1 text-[11px]">
        {isAdmin && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Customer</dt>
            <dd>{parcel.customer.name}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">{isAdmin ? 'Assigned to' : 'Courier'}</dt>
          <dd className="min-w-0">
            {isAdmin ? (
              <AssignStaffControl parcel={parcel} compact />
            ) : parcel.assignedStaff ? (
              parcel.assignedStaff.name
            ) : (
              <span className="text-muted italic">Not yet assigned</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Updated</dt>
          <dd className="text-muted">{formatRelative(parcel.updatedAt)}</dd>
        </div>
      </dl>

      {canAdvance && nextStatus(parcel.status) && (
        <div className="mt-3">
          <AdvanceStatusButton parcel={parcel} confirm />
        </div>
      )}
    </div>
  );
}
