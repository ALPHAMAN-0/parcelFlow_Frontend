import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState } from '@/components/ui/ErrorState';
import { useCreateParcel } from '@/hooks/useParcels';
import { useToast } from '@/hooks/useToast';
import { fieldErrorsFrom } from '@/lib/errorMessages';
import type { CreateParcelPayload } from '@/types/api';

/**
 * Mirrors createParcelSchema (ParcelFlowApi/src/modules/parcels/parcels.schemas.js:19)
 * exactly: five fields, all trimmed, person and area 2-100, type 2-50. The
 * schema is a strictObject, so no extra key may be sent.
 */
const schema = z.object({
  senderName: z.string().trim().min(2, 'At least 2 characters').max(100, 'At most 100 characters'),
  receiverName: z.string().trim().min(2, 'At least 2 characters').max(100, 'At most 100 characters'),
  pickupArea: z.string().trim().min(2, 'At least 2 characters').max(100, 'At most 100 characters'),
  deliveryArea: z.string().trim().min(2, 'At least 2 characters').max(100, 'At most 100 characters'),
  parcelType: z.string().trim().min(2, 'At least 2 characters').max(50, 'At most 50 characters'),
});

/** Suggestions only — the field is free text, matching the API. */
const PARCEL_TYPES = ['Documents', 'Electronics', 'Clothing', 'Fragile', 'Groceries', 'Books', 'Furniture'];
const AREAS = ['Gulshan', 'Banani', 'Dhanmondi', 'Mirpur', 'Uttara', 'Motijheel', 'Mohammadpur'];

const BLANK: CreateParcelPayload = {
  senderName: '',
  receiverName: '',
  pickupArea: '',
  deliveryArea: '',
  parcelType: '',
};

export function CreateParcelForm({ defaultSenderName }: { defaultSenderName?: string }) {
  const navigate = useNavigate();
  const { push } = useToast();
  const mutation = useCreateParcel();

  const [values, setValues] = useState<CreateParcelPayload>({
    ...BLANK,
    senderName: defaultSenderName ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(field: keyof CreateParcelPayload, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    // Clear the field's own error as soon as it is edited.
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    mutation.mutate(parsed.data, {
      onSuccess: (parcel) => {
        push({
          variant: 'success',
          title: 'Parcel created',
          description: 'It starts as Pending and its first history row is already written.',
          mono: parcel.trackingCode,
        });
        navigate(`/parcels/${parcel.trackingCode}`);
      },
      onError: (err) => {
        // A 422 shouldn't happen given the mirrored schema, but if the server
        // disagrees its own per-field messages win over ours.
        setErrors(fieldErrorsFrom(err));
      },
    });
  }

  const rootError = errors._root;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {mutation.isError && Object.keys(errors).length === 0 && (
        <ErrorState error={mutation.error} compact />
      )}
      {rootError && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25">
          {rootError}
        </p>
      )}

      <fieldset className="space-y-4" disabled={mutation.isPending}>
        <legend className="text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">
          People
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Sender name"
            value={values.senderName}
            onChange={(e) => set('senderName', e.target.value)}
            error={errors.senderName}
            placeholder="Who is sending it"
            maxLength={100}
            autoComplete="off"
          />
          <Input
            label="Receiver name"
            value={values.receiverName}
            onChange={(e) => set('receiverName', e.target.value)}
            error={errors.receiverName}
            placeholder="Who is receiving it"
            maxLength={100}
            autoComplete="off"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4" disabled={mutation.isPending}>
        <legend className="text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">
          Route
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Pickup area"
            list="pf-areas"
            value={values.pickupArea}
            onChange={(e) => set('pickupArea', e.target.value)}
            error={errors.pickupArea}
            placeholder="Collect from"
            maxLength={100}
            autoComplete="off"
          />
          <Input
            label="Delivery area"
            list="pf-areas"
            value={values.deliveryArea}
            onChange={(e) => set('deliveryArea', e.target.value)}
            error={errors.deliveryArea}
            placeholder="Deliver to"
            maxLength={100}
            autoComplete="off"
          />
        </div>
        <datalist id="pf-areas">
          {AREAS.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
      </fieldset>

      <fieldset disabled={mutation.isPending}>
        <legend className="text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">
          Contents
        </legend>
        <Input
          label="Parcel type"
          list="pf-types"
          value={values.parcelType}
          onChange={(e) => set('parcelType', e.target.value)}
          error={errors.parcelType}
          placeholder="Documents, Electronics, …"
          maxLength={50}
          hint="Free text — the suggestions are only a shortcut."
          autoComplete="off"
        />
        <datalist id="pf-types">
          {PARCEL_TYPES.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)] pt-4">
        <Button type="submit" loading={mutation.isPending}>
          {mutation.isPending ? 'Creating' : 'Create parcel'}
        </Button>
        <p className="text-muted text-[11px]">
          A tracking code is generated for you. The parcel starts as{' '}
          <span className="font-medium">Pending</span> until an admin assigns a courier.
        </p>
      </div>
    </form>
  );
}
