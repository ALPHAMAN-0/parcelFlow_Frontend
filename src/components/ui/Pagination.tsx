import { cn } from '@/lib/cn';
import type { PaginationMeta } from '@/types/api';
import { Button } from './Button';

/** Compact window of page numbers with ellipses, driven by the API's `meta`. */
function pageWindow(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push('…');
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  meta,
  onPageChange,
  isLoading,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}) {
  const { page, limit, total, totalPages } = meta;
  if (total === 0) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-4 py-3">
      <p className="text-muted text-xs" aria-live="polite">
        Showing <span className="font-medium">{first}</span>–<span className="font-medium">{last}</span> of{' '}
        <span className="font-medium">{total}</span>
      </p>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>

          <div className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`gap-${i}`} className="text-muted px-1.5 text-xs">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  disabled={isLoading}
                  aria-current={p === page ? 'page' : undefined}
                  className={cn(
                    'size-8 rounded-md text-xs font-medium transition-colors',
                    p === page
                      ? 'bg-brand-600 text-white'
                      : 'text-muted hover:surface-sunken hover:text-[var(--text-strong)]',
                  )}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          <span className="text-muted px-1 text-xs sm:hidden">
            {page} / {totalPages}
          </span>

          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
