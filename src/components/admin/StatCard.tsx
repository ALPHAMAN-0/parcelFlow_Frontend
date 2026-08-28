import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/**
 * One figure, prominent, with optional context underneath. Kept deliberately
 * plain: the number is the point, so nothing else competes with it.
 */
export function StatCard({
  label,
  value,
  hint,
  to,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  /** Makes the whole card a link, for figures that have a drill-down. */
  to?: string;
  tone?: 'neutral' | 'positive' | 'warning';
  icon?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">{label}</p>
        {icon && <span className="text-muted shrink-0 opacity-50">{icon}</span>}
      </div>
      <p
        className={cn(
          'mt-2 text-2xl font-bold tabular-nums tracking-tight',
          tone === 'positive' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'warning' && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {value}
      </p>
      {hint && <p className="text-muted mt-1 text-[11px] leading-tight">{hint}</p>}
    </>
  );

  const shell =
    'surface rounded-xl p-4 ring-1 ring-[var(--border-subtle)] shadow-sm shadow-black/[0.03]';

  if (to) {
    return (
      <Link
        to={to}
        className={cn(shell, 'block transition-colors hover:ring-brand-400 focus-visible:ring-brand-500')}
      >
        {body}
      </Link>
    );
  }

  return <div className={shell}>{body}</div>;
}
