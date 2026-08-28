import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ColdStartBanner } from '@/components/ui/ColdStartBanner';
import { ApiStatusFooter } from '@/components/layout/ApiStatusFooter';

/** Shared chrome for the signed-out pages. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ColdStartBanner />

      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="bg-brand-600 flex size-7 items-center justify-center rounded-lg">
            <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l8 4v10l-8 4-8-4V7l8-4Zm0 0v18M4 7l8 4 8-4" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm font-bold tracking-tight">ParcelFlow</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted mt-1.5 text-xs leading-relaxed">{subtitle}</p>
          </div>

          <div className="surface rounded-xl p-5 ring-1 ring-[var(--border-subtle)] shadow-sm">
            {children}
          </div>

          {footer && <div className="mt-4">{footer}</div>}
        </div>
      </main>

      <ApiStatusFooter />
    </div>
  );
}
