import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { describeError, fieldErrorsFrom } from '@/lib/errorMessages';

/**
 * Mirrors registerSchema (auth.schemas.js:21): name 2-80, email, password 1-72.
 *
 * `confirmPassword` is checked here and then discarded — registerSchema is a
 * strictObject, so sending it would be a 422 on an unrecognised key. The same
 * goes for `role`: registration always produces a CUSTOMER, and the API rejects
 * any attempt to ask for something else.
 */
const schema = z
  .object({
    name: z.string().trim().min(2, 'At least 2 characters').max(80, 'At most 80 characters'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
    password: z.string().min(1, 'Password is required').max(72, 'At most 72 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setPending(true);
    try {
      // Only the three keys the API accepts.
      await register({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const fieldErrors = fieldErrorsFrom(err);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      setFormError(describeError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="New accounts are customers, and can create and track their own parcels."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25"
          >
            {formError}
          </p>
        )}

        <Input
          label="Full name"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          autoComplete="name"
          autoFocus
          placeholder="Your name"
          maxLength={80}
          required
        />

        <Input
          label="Email"
          type="email"
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />

        <Input
          label="Password"
          type="password"
          value={values.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          placeholder="••••••••"
          maxLength={72}
          hint="Up to 72 characters — bcrypt ignores anything past that."
          required
        />

        <Input
          label="Confirm password"
          type="password"
          value={values.confirmPassword}
          onChange={(e) => set('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          placeholder="••••••••"
          maxLength={72}
          required
        />

        <Button type="submit" fullWidth loading={pending}>
          {pending ? 'Creating account' : 'Create account'}
        </Button>

        <p className="text-muted text-center text-xs">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
