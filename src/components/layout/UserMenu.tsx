import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RoleBadge } from '@/components/admin/UsersTable';
import { formatDate, initials } from '@/lib/format';

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:surface-sunken"
      >
        <span className="bg-brand-600 flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden text-xs font-medium sm:block">{user.name.split(' ')[0]}</span>
        <svg viewBox="0 0 24 24" className="text-muted size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="surface animate-in absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl ring-1 ring-[var(--border-subtle)] shadow-lg"
        >
          <div className="border-b border-[var(--border-subtle)] px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-muted mt-0.5 truncate text-xs">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <RoleBadge role={user.role} />
              <span className="text-muted text-[10px]">since {formatDate(user.createdAt)}</span>
            </div>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
              navigate('/login', { replace: true });
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
