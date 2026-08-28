import { cn } from '@/lib/cn';

export function Badge({
  className,
  children,
  dot,
}: {
  className?: string;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dot)} aria-hidden="true" />}
      {children}
    </span>
  );
}
