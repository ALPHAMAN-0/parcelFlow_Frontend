import { forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

const FIELD =
  'w-full rounded-lg surface px-3 py-2 text-sm ring-1 ring-inset ring-[var(--border-subtle)] ' +
  'placeholder:text-[var(--text-muted)] transition-shadow ' +
  'focus:ring-2 focus:ring-brand-500 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-[invalid=true]:ring-rose-500 aria-[invalid=true]:focus:ring-rose-500';

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  /** Right-aligned note in the label row, e.g. a character counter. */
  aside?: React.ReactNode;
  id: string;
  children: React.ReactNode;
}

function FieldShell({ label, hint, error, aside, id, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={id} className="block text-xs font-medium">
              {label}
            </label>
          )}
          {aside && <span className="text-muted text-[11px]">{aside}</span>}
        </div>
      )}
      {children}
      {/* aria-live so a validation message reaching an empty slot is announced. */}
      <p
        id={`${id}-msg`}
        aria-live="polite"
        className={cn('text-[11px] leading-tight', error ? 'text-rose-600 dark:text-rose-400' : 'text-muted')}
      >
        {error || hint || ''}
      </p>
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  aside?: React.ReactNode;
  monospace?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, aside, monospace, className, id: idProp, ...rest },
  ref,
) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <FieldShell label={label} hint={hint} error={error} aside={aside} id={id}>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-msg`}
        className={cn(FIELD, monospace && 'font-mono tracking-wide', className)}
        {...rest}
      />
    </FieldShell>
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id: idProp, children, ...rest },
  ref,
) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-msg`}
        className={cn(FIELD, 'appearance-none bg-no-repeat pr-8', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23888'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
          backgroundPosition: 'right 0.6rem center',
          backgroundSize: '1rem',
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});
