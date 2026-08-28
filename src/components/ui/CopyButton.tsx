import { useState } from 'react';
import { cn } from '@/lib/cn';

/** Clipboard writes can be denied; the label just doesn't change if so. */
export function CopyButton({
  value,
  className,
  label = 'Copy',
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* permission denied or insecure context — nothing useful to say */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`${label} ${value}`}
      aria-label={`${label} ${value}`}
      className={cn(
        'text-muted inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] transition-colors hover:surface-sunken hover:text-[var(--text-strong)]',
        className,
      )}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m5 13 4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
