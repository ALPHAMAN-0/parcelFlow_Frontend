import { cn } from '@/lib/cn';

/**
 * Wide tables scroll inside this container rather than pushing the page
 * sideways. `-mx` bleeds the scroll area to the card edge on mobile.
 */
export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('w-full overflow-x-auto', className)}>{children}</div>;
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={cn('w-full min-w-[44rem] border-collapse text-sm', className)}>{children}</table>;
}

export function Th({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <th
      scope="col"
      className={cn(
        'surface-sunken text-muted border-b border-[var(--border-subtle)] px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase',
        align === 'left' && 'text-left',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <td
      className={cn(
        'border-b border-[var(--border-subtle)] px-4 py-3 align-middle',
        align === 'left' && 'text-left',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tr className={cn('transition-colors hover:surface-sunken', className)}>{children}</tr>;
}
