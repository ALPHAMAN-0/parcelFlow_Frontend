import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumber } from '@/lib/format';

/** The API returns at most five, already ordered by count descending. */
export function TopAreas({ areas }: { areas: { deliveryArea: string; count: number }[] }) {
  if (areas.length === 0) {
    return <EmptyState title="No delivery areas yet" description="They appear once parcels exist." />;
  }

  const max = Math.max(...areas.map((a) => a.count));

  return (
    <ol className="space-y-2.5">
      {areas.map((area, i) => (
        <li key={area.deliveryArea}>
          <Link
            to={`/parcels?deliveryArea=${encodeURIComponent(area.deliveryArea)}`}
            className="block rounded-md px-1 py-0.5 transition-colors hover:surface-sunken"
          >
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-muted w-3 shrink-0 text-[10px] font-bold tabular-nums opacity-60">
                  {i + 1}
                </span>
                <span className="truncate font-medium">{area.deliveryArea}</span>
              </span>
              <span className="font-semibold tabular-nums">{formatNumber(area.count)}</span>
            </div>
            <div className="surface-sunken mt-1.5 ml-5 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-brand-500 h-full rounded-full transition-[width] duration-500"
                style={{ width: `${(area.count / max) * 100}%` }}
              />
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
