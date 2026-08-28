import { cn } from '@/lib/cn';
import { formatDateTime, formatRelative, initials } from '@/lib/format';
import { STATUS_LABELS, STATUS_STYLES } from '@/domain/parcelStatus';
import { ROLE_LABELS, type HistoryEntry } from '@/types/api';

/**
 * The append-only audit trail, oldest first (the order the API returns).
 * Exactly one row per parcel has oldStatus === null: the creation record.
 */
export function StatusTimeline({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="text-muted px-5 py-6 text-center text-xs">No history recorded yet.</p>;
  }

  return (
    <ol className="relative space-y-0 px-5 py-4">
      {history.map((entry, i) => {
        const style = STATUS_STYLES[entry.newStatus];
        const isLast = i === history.length - 1;
        const isCreation = entry.oldStatus === null;

        return (
          <li key={entry.id} className="relative flex gap-3.5 pb-5 last:pb-0">
            {/* Rail, stopped short on the final row. */}
            {!isLast && (
              <span
                className="absolute top-7 left-[13px] h-full w-0.5 -translate-x-1/2 surface-sunken"
                aria-hidden="true"
              />
            )}

            <span
              className={cn(
                'relative z-10 mt-0.5 flex size-[26px] shrink-0 items-center justify-center rounded-full ring-4',
                style.dot,
                'ring-[var(--surface-raised)]',
              )}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="size-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                {isCreation ? (
                  <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
                ) : (
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-xs font-semibold">
                {isCreation ? (
                  <>Created as {STATUS_LABELS[entry.newStatus]}</>
                ) : (
                  <>
                    {STATUS_LABELS[entry.oldStatus!]}{' '}
                    <span className="text-muted font-normal">→</span> {STATUS_LABELS[entry.newStatus]}
                  </>
                )}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="surface-sunken text-muted inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2 pl-0.5 text-[11px]">
                  <span className="bg-brand-600 flex size-4 items-center justify-center rounded-full text-[8px] font-bold text-white">
                    {initials(entry.changedBy.name)}
                  </span>
                  {entry.changedBy.name}
                  <span className="opacity-60">· {ROLE_LABELS[entry.changedBy.role]}</span>
                </span>
              </div>

              <p className="text-muted mt-1 text-[11px]">
                <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
                <span className="opacity-60"> · {formatRelative(entry.createdAt)}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
