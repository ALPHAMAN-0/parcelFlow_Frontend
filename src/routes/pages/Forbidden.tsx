import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/types/api';

export function ForbiddenPage() {
  const { role } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </div>
      <h1 className="text-lg font-bold">That page is not for your role</h1>
      <p className="text-muted mt-2 max-w-md text-xs leading-relaxed">
        You are signed in as {role ? ROLE_LABELS[role] : 'a user'}. The API enforces this too, so
        there is nothing to work around here — the endpoint would answer 403 regardless of what the
        interface offered.
      </p>
      <Link to="/dashboard" className="mt-5">
        <Button size="sm">Back to dashboard</Button>
      </Link>
    </div>
  );
}
