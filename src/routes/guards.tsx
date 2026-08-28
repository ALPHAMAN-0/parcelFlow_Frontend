import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import type { Role } from '@/types/api';

function FullPageSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted flex flex-col items-center gap-3">
        <Spinner className="size-6" />
        <p className="text-xs">{label}</p>
      </div>
    </div>
  );
}

/**
 * Client-side guards are for navigation, not security. The API re-checks the
 * role on every request and scopes every query, so bypassing these only gets
 * you a 403 or an empty list.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) return <FullPageSpinner label="Restoring your session…" />;

  if (!isAuthenticated) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
}

export function RequireRole({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { role, isBootstrapping } = useAuth();

  if (isBootstrapping) return <FullPageSpinner label="Checking permissions…" />;
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to="/forbidden" replace />;

  return <>{children}</>;
}

/** Keeps a signed-in user off /login and /register. */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) return <FullPageSpinner label="Loading…" />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
