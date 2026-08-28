import { describeError, errorTitle } from '@/lib/errorMessages';
import { isApiError } from '@/lib/ApiError';
import { Button } from './Button';

/**
 * The standard failure panel. Shows the API's requestId when there is one —
 * every API error carries it, and it matches the X-Request-Id header, so a
 * problem a user reports can actually be found in the logs.
 */
export function ErrorState({
  error,
  onRetry,
  compact,
}: {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const requestId = isApiError(error) ? error.requestId : undefined;

  return (
    <div
      role="alert"
      className={
        compact
          ? 'rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25'
          : 'flex flex-col items-center justify-center px-6 py-12 text-center'
      }
    >
      {compact ? (
        <span>{describeError(error)}</span>
      ) : (
        <>
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold">{errorTitle(error)}</h3>
          <p className="text-muted mt-1.5 max-w-md text-xs leading-relaxed">{describeError(error)}</p>
          {requestId && (
            <p className="text-muted mt-2 font-mono text-[10px] opacity-70">request {requestId}</p>
          )}
          {onRetry && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
              Try again
            </Button>
          )}
        </>
      )}
    </div>
  );
}
