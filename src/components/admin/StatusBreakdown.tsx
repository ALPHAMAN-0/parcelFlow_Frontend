import { Link } from 'react-router-dom';
import { STATUS_LABELS, STATUS_ORDER, STATUS_STYLES, type ParcelStatusValue } from '@/domain/parcelStatus';
import { formatNumber } from '@/lib/format';

/**
 * Horizontal bars, hand-rolled. A chart library would add ~50kb to render five
 * rows whose lengths are one division each.
 *
 * Bars are scaled to the largest value rather than the total, so a small
 * category is still readable; the count is printed, so the scale is never the
 * only source of the number.
 */
export function StatusBreakdown({
  byStatus,
  total,
}: {
  byStatus: Record<ParcelStatusValue, number>;
  total: number;
}) {
  const max = Math.max(1, ...STATUS_ORDER.map((s) => byStatus[s] ?? 0));

  return (
    <ul className="space-y-2.5">
      {STATUS_ORDER.map((status) => {
        const count = byStatus[status] ?? 0;
        const share = total === 0 ? 0 : count / total;
        return (
          <li key={status}>
            <Link
              to={`/parcels?status=${status}`}
              className="group block rounded-md px-1 py-0.5 transition-colors hover:surface-sunken"
            >
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="flex items-center gap-2 font-medium">
                  <span className={`size-2 rounded-full ${STATUS_STYLES[status].dot}`} aria-hidden="true" />
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-muted tabular-nums">
                  <span className="text-[var(--text-strong)] font-semibold">{formatNumber(count)}</span>
                  <span className="ml-1.5 opacity-70">{(share * 100).toFixed(0)}%</span>
                </span>
              </div>
              <div className="surface-sunken mt-1.5 h-2 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full ${STATUS_STYLES[status].dot} transition-[width] duration-500`}
                  style={{ width: `${(count / max) * 100}%` }}
                  role="img"
                  aria-label={`${STATUS_LABELS[status]}: ${count} of ${total} parcels`}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
