import { useId } from 'react';
import { useAssignParcelStaff } from '@/hooks/useParcels';
import { useDeliveryStaff } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { describeError, errorTitle } from '@/lib/errorMessages';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import type { Parcel } from '@/types/api';

/**
 * Admin-only. The options come from GET /admin/users?role=DELIVERY_STAFF, so a
 * non-staff user can't be picked — the API would answer 422 NOT_DELIVERY_STAFF.
 * The empty option sends `null`, which is how the API clears an assignment.
 *
 * A delivered parcel cannot be reassigned (409 PARCEL_ALREADY_DELIVERED), so
 * the control renders as static text instead.
 */
export function AssignStaffControl({ parcel, compact }: { parcel: Parcel; compact?: boolean }) {
  const id = useId();
  const mutation = useAssignParcelStaff();
  const { data: staff, isLoading } = useDeliveryStaff();
  const { push } = useToast();

  if (parcel.status === 'DELIVERED') {
    return (
      <span className="text-muted text-[11px]">
        {parcel.assignedStaff ? parcel.assignedStaff.name : 'Unassigned'}
      </span>
    );
  }

  function onChange(value: string) {
    const staffId = value === '' ? null : value;
    mutation.mutate(
      { id: parcel.id, staffId },
      {
        onSuccess: (updated) =>
          push({
            variant: 'success',
            title: updated.assignedStaff ? 'Parcel assigned' : 'Assignment cleared',
            description: updated.assignedStaff
              ? `${updated.trackingCode} → ${updated.assignedStaff.name}`
              : `${updated.trackingCode} is now unassigned.`,
          }),
        onError: (err) =>
          push({ variant: 'error', title: errorTitle(err), description: describeError(err) }),
      },
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="sr-only">
        Assign delivery staff for {parcel.trackingCode}
      </label>
      <select
        id={id}
        value={parcel.assignedStaffId ?? ''}
        disabled={mutation.isPending || isLoading}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'surface rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-[var(--border-subtle)]',
          'focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:opacity-60',
          compact ? 'max-w-[10rem]' : 'w-full',
          !parcel.assignedStaffId && 'text-muted',
        )}
      >
        <option value="">{isLoading ? 'Loading staff…' : 'Unassigned'}</option>
        {staff?.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      {mutation.isPending && <Spinner className="size-3.5 shrink-0" label="Saving assignment" />}
    </div>
  );
}
