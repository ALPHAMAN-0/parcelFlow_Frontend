import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { ErrorState } from '@/components/ui/ErrorState';
import { useUpdateUserRole } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { describeError, errorTitle } from '@/lib/errorMessages';
import { pluralize } from '@/lib/format';
import { ROLES, ROLE_LABELS, type Role, type User } from '@/types/api';

/**
 * Changing a role has a side effect the admin has to know about: demoting a
 * delivery staff member releases every undelivered parcel assigned to them, in
 * the same transaction. That is shown before the change, and the actual count
 * is reported after.
 */
export function RoleChangeDialog({
  user,
  open,
  onClose,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
}) {
  const mutation = useUpdateUserRole();
  const { push } = useToast();
  const [role, setRole] = useState<Role>(user?.role ?? 'CUSTOMER');

  useEffect(() => {
    if (user) setRole(user.role);
    mutation.reset();
    // Only when the target user changes; resetting on every render would clear
    // the error the admin is trying to read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, open]);

  if (!user) return null;

  // Re-bound as a const so the null check above survives into submit(): TS
  // discards narrowing of a parameter binding inside a nested function.
  const target = user;
  const unchanged = role === target.role;
  const isDemotion = target.role === 'DELIVERY_STAFF' && role !== 'DELIVERY_STAFF';

  function submit() {
    mutation.mutate(
      { id: target.id, role },
      {
        onSuccess: (result) => {
          push({
            variant: 'success',
            title: `${result.user.name} is now ${ROLE_LABELS[result.user.role]}`,
            description:
              result.releasedParcels > 0
                ? `${pluralize(result.releasedParcels, 'undelivered parcel')} released back to unassigned.`
                : `Changed from ${ROLE_LABELS[result.previousRole]}.`,
          });
          onClose();
        },
        onError: (err) =>
          push({ variant: 'error', title: errorTitle(err), description: describeError(err) }),
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change role"
      description={`${target.name} · ${target.email}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={mutation.isPending} disabled={unchanged}>
            {unchanged ? 'No change selected' : `Make ${ROLE_LABELS[role]}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="surface-sunken flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-xs">
          <span className="font-medium">{ROLE_LABELS[target.role]}</span>
          <svg viewBox="0 0 24 24" className="text-muted size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={unchanged ? 'text-muted' : 'text-brand-600 dark:text-brand-400 font-semibold'}>
            {ROLE_LABELS[role]}
          </span>
        </div>

        <Select label="New role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
              {r === target.role ? ' (current)' : ''}
            </option>
          ))}
        </Select>

        {isDemotion && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25">
            <strong className="font-semibold">Heads up:</strong> this user is delivery staff. Removing
            that role also releases every undelivered parcel assigned to them, so nothing stays
            assigned to someone who can no longer act on it. Delivered parcels keep their record.
          </p>
        )}

        {role === 'ADMIN' && target.role !== 'ADMIN' && (
          <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs leading-relaxed text-violet-900 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25">
            Admins can see and modify every parcel and every user, including changing other people's
            roles.
          </p>
        )}

        {mutation.isError && <ErrorState error={mutation.error} compact />}
      </div>
    </Modal>
  );
}
