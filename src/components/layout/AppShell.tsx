import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarNav } from './Sidebar';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { ApiStatusFooter } from './ApiStatusFooter';
import { ColdStartBanner } from '@/components/ui/ColdStartBanner';
import { cn } from '@/lib/cn';

function Logo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2">
      <span className="bg-brand-600 flex size-7 items-center justify-center rounded-lg">
        <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l8 4v10l-8 4-8-4V7l8-4Zm0 0v18M4 7l8 4 8-4" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-sm font-bold tracking-tight">ParcelFlow</span>
    </Link>
  );
}

/** Signed-in chrome: fixed sidebar on desktop, slide-over drawer on mobile. */
export function AppShell() {
  const { role } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer on navigation, so a tap-through doesn't leave it covering
  // the page it just opened.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  if (!role) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <ColdStartBanner />

      <header className="surface sticky top-0 z-30 border-b border-[var(--border-subtle)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="text-muted -ml-1 rounded-lg p-2 transition-colors hover:surface-sunken lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <Logo />
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20">
            <SidebarNav role={role} />
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <ApiStatusFooter />

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            className={cn(
              'surface animate-slide-in absolute inset-y-0 left-0 w-64 p-4 shadow-xl',
              'flex flex-col gap-4',
            )}
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="text-muted rounded-lg p-2 hover:surface-sunken"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarNav role={role} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
