import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-brand-600 dark:text-brand-400 text-4xl font-bold">404</p>
      <h1 className="mt-3 text-lg font-bold">Page not found</h1>
      <p className="text-muted mt-2 max-w-md text-xs leading-relaxed">
        This route does not exist. If you followed a tracking-code link, check the code —
        they look like <span className="font-mono">PF-XXXXX-XXXXX</span>.
      </p>
      <div className="mt-5 flex gap-2">
        <Link to={isAuthenticated ? '/dashboard' : '/'}>
          <Button size="sm">{isAuthenticated ? 'Back to dashboard' : 'Back to home'}</Button>
        </Link>
        {isAuthenticated && (
          <Link to="/track">
            <Button size="sm" variant="secondary">
              Track a parcel
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
