import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { describeError, errorTitle, fieldErrorsFrom } from '@/lib/errorMessages';
import { isApiError } from '@/lib/ApiError';
import { DEMO_ACCOUNTS } from './demoAccounts';

/**
 * Mirrors loginSchema (auth.schemas.js:27): email trimmed + lowercased, and a
 * password of 1-72 characters.
 *
 * Note the minimum is 1, not 8. The API's registration policy is min(1) too —
 * gating at 8 here would lock out the seeded demo accounts, whose passwords are
 * shorter than the README implies.
 */
const schema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  password: z.string().min(1, 'Password is required').max(72, 'At most 72 characters'),
});

export function LoginPage() {
  const { login, expiryNotice, clearExpiryNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Where RequireAuth wanted to go before it redirected here.
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  useEffect(() => () => clearExpiryNotice(), [clearExpiryNotice]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      await login(parsed.data);
      navigate(from, { replace: true });
    } catch (err) {
      const fieldErrors = fieldErrorsFrom(err);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      // INVALID_CREDENTIALS is a 401 but belongs on this form, not as a session
      // expiry — the API client deliberately does not treat it as one.
      setFormError(describeError(err));
      if (isApiError(err) && err.status === 429) {
        setFormError(`${errorTitle(err)}: ${describeError(err)}`);
      }
    } finally {
      setPending(false);
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrors({});
    setFormError(null);
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access your parcels, deliveries and reports."
      footer={
        <div className="surface rounded-xl p-4 ring-1 ring-[var(--border-subtle)]">
          <p className="text-muted mb-2.5 text-[11px] leading-relaxed">
            <span className="font-semibold">Demo accounts.</span> Seeded data — click one to fill the
            form.
          </p>
          <div className="space-y-1">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account.email, account.password)}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors hover:surface-sunken"
              >
                <span className="min-w-0">
                  <span className="font-medium">{account.label}</span>
                  <span className="text-muted ml-1.5 truncate font-mono">{account.email}</span>
                </span>
                <span className="text-brand-600 dark:text-brand-400 shrink-0 font-medium">Use</span>
              </button>
            ))}
          </div>
        </div>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {expiryNotice && (
          <p
            role="status"
            className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25"
          >
            {expiryNotice}
          </p>
        )}

        {formError && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25"
          >
            {formError}
          </p>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />

        <Button type="submit" fullWidth loading={pending}>
          {pending ? 'Signing in' : 'Sign in'}
        </Button>

        <p className="text-muted text-center text-xs">
          No account?{' '}
          <Link to="/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
