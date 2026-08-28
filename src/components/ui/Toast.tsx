import { useToast, type ToastVariant } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

const STYLES: Record<ToastVariant, { ring: string; icon: string; path: string }> = {
  success: {
    ring: 'ring-emerald-500/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
    path: 'm5 13 4 4L19 7',
  },
  error: {
    ring: 'ring-rose-500/30',
    icon: 'text-rose-600 dark:text-rose-400',
    path: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  },
  info: {
    ring: 'ring-sky-500/30',
    icon: 'text-sky-600 dark:text-sky-400',
    path: 'M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
};

/** Mounted once at the app root. aria-live so screen readers get the message. */
export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:bottom-0 sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const style = STYLES[toast.variant];
        return (
          <div
            key={toast.id}
            className={cn(
              'surface animate-slide-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl p-3.5 shadow-lg ring-1',
              style.ring,
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className={cn('mt-0.5 size-4 shrink-0', style.icon)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <path d={style.path} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="text-muted mt-0.5 text-xs leading-relaxed">{toast.description}</p>
              )}
              {toast.mono && (
                <p className="mt-1 font-mono text-xs font-semibold tracking-wider">{toast.mono}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-muted rounded p-0.5 transition-colors hover:text-[var(--text-strong)]"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
