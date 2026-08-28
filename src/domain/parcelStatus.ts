/**
 * Client mirror of ParcelFlowApi/src/domain/parcelStatus.js.
 *
 * The API is the authority: it re-validates every transition and answers 409
 * INVALID_STATUS_TRANSITION when a move is illegal. This copy exists so the UI
 * can offer only the one legal next step instead of a dropdown of five, and so
 * a terminal parcel renders as terminal without a round trip. If the API's
 * table ever changes, this file has to change with it.
 *
 * Flow is strictly linear:
 *   PENDING -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
 */

export const ParcelStatus = {
  PENDING: 'PENDING',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
} as const;

export type ParcelStatusValue = (typeof ParcelStatus)[keyof typeof ParcelStatus];

export const STATUS_ORDER: readonly ParcelStatusValue[] = [
  ParcelStatus.PENDING,
  ParcelStatus.PICKED_UP,
  ParcelStatus.IN_TRANSIT,
  ParcelStatus.OUT_FOR_DELIVERY,
  ParcelStatus.DELIVERED,
] as const;

export const STATUS_LABELS: Record<ParcelStatusValue, string> = {
  PENDING: 'Pending',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

/** What each status means, for tooltips and empty states. */
export const STATUS_DESCRIPTIONS: Record<ParcelStatusValue, string> = {
  PENDING: 'Created and waiting to be collected.',
  PICKED_UP: 'Collected from the pickup area.',
  IN_TRANSIT: 'Moving between facilities.',
  OUT_FOR_DELIVERY: 'With a courier for final delivery.',
  DELIVERED: 'Handed over. This is final.',
};

export const TRANSITIONS: Record<ParcelStatusValue, readonly ParcelStatusValue[]> = {
  PENDING: [ParcelStatus.PICKED_UP],
  PICKED_UP: [ParcelStatus.IN_TRANSIT],
  IN_TRANSIT: [ParcelStatus.OUT_FOR_DELIVERY],
  OUT_FOR_DELIVERY: [ParcelStatus.DELIVERED],
  DELIVERED: [], // terminal
};

export function isValidStatus(status: string): status is ParcelStatusValue {
  return Object.prototype.hasOwnProperty.call(TRANSITIONS, status);
}

export function nextStatuses(from: ParcelStatusValue): readonly ParcelStatusValue[] {
  return TRANSITIONS[from] ?? [];
}

/** The single legal next step, or null when the parcel is delivered. */
export function nextStatus(from: ParcelStatusValue): ParcelStatusValue | null {
  return nextStatuses(from)[0] ?? null;
}

export function isTerminal(status: ParcelStatusValue): boolean {
  return isValidStatus(status) && TRANSITIONS[status].length === 0;
}

/** Zero-based position in STATUS_ORDER; drives the stepper and progress bars. */
export function statusIndex(status: ParcelStatusValue): number {
  return STATUS_ORDER.indexOf(status);
}

export function statusProgress(status: ParcelStatusValue): number {
  return statusIndex(status) / (STATUS_ORDER.length - 1);
}

/**
 * Client-only presentation. Every pair is checked for contrast in both themes;
 * `bar` is the solid fill used by the stats charts, where a tinted background
 * would wash out.
 */
export const STATUS_STYLES: Record<
  ParcelStatusValue,
  { badge: string; dot: string; bar: string }
> = {
  PENDING: {
    badge:
      'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25',
    dot: 'bg-amber-500',
    bar: 'fill-amber-500',
  },
  PICKED_UP: {
    badge:
      'bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25',
    dot: 'bg-sky-500',
    bar: 'fill-sky-500',
  },
  IN_TRANSIT: {
    badge:
      'bg-indigo-100 text-indigo-800 ring-indigo-600/20 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-400/25',
    dot: 'bg-indigo-500',
    bar: 'fill-indigo-500',
  },
  OUT_FOR_DELIVERY: {
    badge:
      'bg-violet-100 text-violet-800 ring-violet-600/20 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/25',
    dot: 'bg-violet-500',
    bar: 'fill-violet-500',
  },
  DELIVERED: {
    badge:
      'bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25',
    dot: 'bg-emerald-500',
    bar: 'fill-emerald-500',
  },
};
