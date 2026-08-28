import { useColdStart } from '@/hooks/useApiHealth';
import { Spinner } from './Spinner';

/**
 * Render's free tier spins a service down after ~15 minutes idle, and the next
 * request then waits 30-60s for it to boot. Without this the app looks broken
 * for a minute; with it, the wait is explained.
 */
export function ColdStartBanner() {
  const waking = useColdStart();
  if (!waking) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-500/15 px-4 py-2 text-xs font-medium text-amber-800 dark:text-amber-300"
    >
      <Spinner className="size-3.5" />
      Waking the backend up — free hosting sleeps when idle, so this first request can take up to a
      minute.
    </div>
  );
}
