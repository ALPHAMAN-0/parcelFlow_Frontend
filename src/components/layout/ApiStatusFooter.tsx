import { API_BASE_URL, API_HOST, IS_API_CONFIGURED } from '@/lib/config';
import { useApiHealth } from '@/hooks/useApiHealth';
import { cn } from '@/lib/cn';

/**
 * Shows which backend the app is actually talking to, with a live health dot.
 * This is the fastest way to tell whether a Vercel deployment picked up its
 * VITE_API_BASE_URL — a build that missed the variable points at localhost, and
 * this makes that visible instead of mysterious.
 */
export function ApiStatusFooter() {
  const { isOnline, isChecking, isWaking, failed } = useApiHealth();

  // Order matters. "waking" outranks "offline" because a cold-starting Render
  // instance is not unreachable, it is booting — and saying otherwise is a
  // claim that will be wrong within the minute.
  const state = isOnline
    ? 'online'
    : isWaking
      ? 'waking'
      : failed
        ? 'offline'
        : isChecking
          ? 'checking'
          : 'unknown';

  return (
    <footer className="border-t border-[var(--border-subtle)] px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-muted text-[11px]">
          ParcelFlow — parcel delivery management
        </p>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'size-1.5 rounded-full',
              state === 'online' && 'bg-emerald-500',
              state === 'offline' && 'bg-rose-500',
              state === 'waking' && 'animate-pulse bg-amber-500',
              state === 'checking' && 'animate-pulse bg-amber-500',
              state === 'unknown' && 'bg-slate-400',
            )}
            aria-hidden="true"
          />
          <span className="text-muted text-[11px]">
            API{' '}
            <a
              href={API_BASE_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono hover:underline"
            >
              {API_HOST}
            </a>
            <span className="ml-1.5 opacity-70">
              {state === 'online' && 'reachable'}
              {state === 'waking' && 'waking up…'}
              {/* Says "retrying" because it is: the poll drops to 8s on failure. */}
              {state === 'offline' && 'unreachable — retrying'}
              {state === 'checking' && 'checking…'}
            </span>
          </span>
          {!IS_API_CONFIGURED && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              VITE_API_BASE_URL not set
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
