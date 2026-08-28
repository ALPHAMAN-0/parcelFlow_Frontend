import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import type { Role } from '@/types/api';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  /** Which roles see this link. Mirrors what the API would allow. */
  roles: Role[];
  end?: boolean;
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ALL_ROLES: Role[] = ['CUSTOMER', 'DELIVERY_STAFF', 'ADMIN'];

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    roles: ALL_ROLES,
    end: true,
    icon: <Icon path="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-4H4v4ZM14 8h6V4h-6v4Z" />,
  },
  {
    to: '/parcels',
    label: 'Parcels',
    roles: ALL_ROLES,
    end: true,
    icon: <Icon path="M12 3l8 4v10l-8 4-8-4V7l8-4Zm0 0v18M4 7l8 4 8-4" />,
  },
  {
    to: '/parcels/new',
    label: 'New parcel',
    // Staff cannot create: POST /parcels allows CUSTOMER and ADMIN only.
    roles: ['CUSTOMER', 'ADMIN'],
    icon: <Icon path="M12 5v14m-7-7h14" />,
  },
  {
    to: '/track',
    label: 'Track',
    roles: ALL_ROLES,
    icon: <Icon path="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
  },
  {
    to: '/admin/stats',
    label: 'Statistics',
    roles: ['ADMIN'],
    icon: <Icon path="M3 3v18h18M8 17V9m5 8V5m5 12v-6" />,
  },
  {
    to: '/admin/users',
    label: 'Users',
    roles: ['ADMIN'],
    icon: <Icon path="M17 20h5v-2a3 3 0 0 0-4-2.8M9 20H2v-2a5 5 0 0 1 8-4m6-4a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm4-3a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />,
  },
];

export function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="space-y-0.5" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-muted hover:surface-sunken hover:text-[var(--text-strong)]',
            )
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
