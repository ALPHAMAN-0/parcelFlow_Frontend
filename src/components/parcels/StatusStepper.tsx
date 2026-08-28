import { cn } from '@/lib/cn';
import {
  STATUS_LABELS,
  STATUS_ORDER,
  STATUS_STYLES,
  statusIndex,
  type ParcelStatusValue,
} from '@/domain/parcelStatus';

/**
 * The five states as a progress track. The flow is strictly linear, so a
 * parcel's position implies every earlier step was completed.
 */
export function StatusStepper({ status }: { status: ParcelStatusValue }) {
  const current = statusIndex(status);

  return (
    <ol className="flex items-start gap-0" aria-label="Delivery progress">
      {STATUS_ORDER.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const style = STATUS_STYLES[step];

        return (
          <li key={step} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              {/* Connector to the previous node; hidden on the first. */}
              <div
                className={cn(
                  'h-0.5 flex-1 rounded-full',
                  i === 0 && 'invisible',
                  i <= current ? 'bg-brand-500' : 'surface-sunken',
                )}
                aria-hidden="true"
              />
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
                  done && 'bg-brand-500 text-white',
                  active && cn(style.dot, 'text-white ring-4 ring-brand-500/20'),
                  !done && !active && 'surface-sunken text-muted ring-1 ring-[var(--border-subtle)]',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <div
                className={cn(
                  'h-0.5 flex-1 rounded-full',
                  i === STATUS_ORDER.length - 1 && 'invisible',
                  i < current ? 'bg-brand-500' : 'surface-sunken',
                )}
                aria-hidden="true"
              />
            </div>
            <span
              className={cn(
                'px-1 text-center text-[10px] leading-tight sm:text-[11px]',
                active ? 'font-semibold' : 'text-muted',
              )}
            >
              {STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
