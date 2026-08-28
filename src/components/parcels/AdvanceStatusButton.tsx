import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useUpdateParcelStatus } from '@/hooks/useParcels';
import { useToast } from '@/hooks/useToast';
import { describeError, errorTitle } from '@/lib/errorMessages';
import { STATUS_LABELS, isTerminal, nextStatus } from '@/domain/parcelStatus';
import type { Parcel } from '@/types/api';

/**
 * Advances a parcel by exactly one step. There is no status picker because the
 * flow is linear: from any state there is at most one legal next state, so
 * offering five options would mean offering four guaranteed 409s.
 */
export function AdvanceStatusButton({
  parcel,
  size = 'sm',
  confirm = false,
  onDone,
}: {
  parcel: Parcel;
  size?: 'sm' | 'md';
  /** Ask before the final, irreversible move to Delivered. */
  confirm?: boolean;
  onDone?: () => void;
}) {
  const mutation = useUpdateParcelStatus();
  const { push } = useToast();
  const [confirming, setConfirming] = useState(false);

  const next = nextStatus(parcel.status);

  if (!next || isTerminal(parcel.status)) {
    return (
      <span className="text-muted text-[11px] whitespace-nowrap" title="Delivered is a final status">
        Complete
      </span>
    );
  }

  function run() {
    setConfirming(false);
    mutation.mutate(
      { id: parcel.id, status: next! },
      {
        onSuccess: (updated) => {
          push({
            variant: 'success',
            title: `Moved to ${STATUS_LABELS[updated.status]}`,
            description: `${parcel.trackingCode} · a history row was written.`,
          });
          onDone?.();
        },
        onError: (err) =>
          push({ variant: 'error', title: errorTitle(err), description: describeError(err) }),
      },
    );
  }

  // Delivered is terminal, so it gets a confirmation where the others don't.
  const needsConfirm = confirm && next === 'DELIVERED';

  return (
    <>
      <Button
        size={size}
        variant={next === 'DELIVERED' ? 'success' : 'primary'}
        loading={mutation.isPending}
        onClick={() => (needsConfirm ? setConfirming(true) : run())}
      >
        {mutation.isPending ? 'Updating' : `Mark ${STATUS_LABELS[next]}`}
      </Button>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Mark this parcel delivered?"
        description="Delivered is the final status. It cannot be undone, and the change is written to the parcel's permanent history."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={run} loading={mutation.isPending}>
              Yes, mark delivered
            </Button>
          </>
        }
      >
        <dl className="surface-sunken space-y-1.5 rounded-lg p-3 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Tracking code</dt>
            <dd className="font-mono font-semibold">{parcel.trackingCode}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Receiver</dt>
            <dd className="font-medium">{parcel.receiverName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Delivery area</dt>
            <dd className="font-medium">{parcel.deliveryArea}</dd>
          </div>
        </dl>
      </Modal>
    </>
  );
}
