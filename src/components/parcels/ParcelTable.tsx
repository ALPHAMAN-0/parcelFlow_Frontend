import { Link } from 'react-router-dom';
import { Table, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { StatusBadge } from './StatusBadge';
import { AdvanceStatusButton } from './AdvanceStatusButton';
import { AssignStaffControl } from './AssignStaffControl';
import { formatRelative } from '@/lib/format';
import { nextStatus } from '@/domain/parcelStatus';
import type { Parcel, Role } from '@/types/api';

/**
 * Desktop view. Which columns and actions appear is decided by role, matching
 * what the API will actually permit: only staff and admin can advance a status,
 * only admin can assign.
 */
export function ParcelTable({ parcels, role }: { parcels: Parcel[]; role: Role }) {
  const isAdmin = role === 'ADMIN';
  const canAdvance = role === 'ADMIN' || role === 'DELIVERY_STAFF';

  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <Th>Tracking code</Th>
            <Th>Status</Th>
            <Th>Route</Th>
            <Th>Type</Th>
            {isAdmin && <Th>Customer</Th>}
            <Th>{isAdmin ? 'Assigned to' : 'Courier'}</Th>
            <Th>Updated</Th>
            {canAdvance && <Th align="right">Action</Th>}
          </tr>
        </thead>
        <tbody>
          {parcels.map((parcel) => (
            <Tr key={parcel.id}>
              <Td>
                <Link
                  to={`/parcels/${parcel.trackingCode}`}
                  className="text-brand-600 dark:text-brand-400 font-mono text-xs font-semibold tracking-wide hover:underline"
                >
                  {parcel.trackingCode}
                </Link>
                <p className="text-muted mt-0.5 text-[11px]">
                  {parcel.senderName} → {parcel.receiverName}
                </p>
              </Td>

              <Td>
                <StatusBadge status={parcel.status} />
              </Td>

              <Td>
                <span className="text-xs">
                  {parcel.pickupArea} <span className="text-muted">→</span> {parcel.deliveryArea}
                </span>
              </Td>

              <Td>
                <span className="text-muted text-xs">{parcel.parcelType}</span>
              </Td>

              {isAdmin && (
                <Td>
                  <span className="text-xs">{parcel.customer.name}</span>
                </Td>
              )}

              <Td>
                {isAdmin ? (
                  <AssignStaffControl parcel={parcel} compact />
                ) : parcel.assignedStaff ? (
                  <span className="text-xs">{parcel.assignedStaff.name}</span>
                ) : (
                  <span className="text-muted text-xs italic">Not yet assigned</span>
                )}
              </Td>

              <Td>
                <span className="text-muted text-[11px] whitespace-nowrap">
                  {formatRelative(parcel.updatedAt)}
                </span>
              </Td>

              {canAdvance && (
                <Td align="right">
                  {nextStatus(parcel.status) ? (
                    <AdvanceStatusButton parcel={parcel} confirm />
                  ) : (
                    <span className="text-muted text-[11px]">Complete</span>
                  )}
                </Td>
              )}
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
