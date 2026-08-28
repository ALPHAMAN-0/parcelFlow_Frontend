import { Link } from 'react-router-dom';
import { ROLES, ROLE_LABELS, type Role } from '@/types/api';
import { formatNumber } from '@/lib/format';

const TONE: Record<Role, string> = {
  CUSTOMER: 'bg-sky-500',
  DELIVERY_STAFF: 'bg-indigo-500',
  ADMIN: 'bg-violet-500',
};

export function RoleBreakdown({ byRole, total }: { byRole: Record<Role, number>; total: number }) {
  return (
    <div className="space-y-3">
      {/* Single stacked bar: roles partition one population, so proportion is
          the interesting comparison, not magnitude. */}
      <div
        className="surface-sunken flex h-2.5 overflow-hidden rounded-full"
        role="img"
        aria-label={ROLES.map((r) => `${ROLE_LABELS[r]}: ${byRole[r] ?? 0}`).join(', ')}
      >
        {ROLES.map((role) => {
          const count = byRole[role] ?? 0;
          if (count === 0) return null;
          return (
            <div
              key={role}
              className={TONE[role]}
              style={{ width: `${total === 0 ? 0 : (count / total) * 100}%` }}
            />
          );
        })}
      </div>

      <ul className="space-y-1.5">
        {ROLES.map((role) => (
          <li key={role}>
            <Link
              to={`/admin/users?role=${role}`}
              className="flex items-baseline justify-between gap-3 rounded-md px-1 py-1 text-xs transition-colors hover:surface-sunken"
            >
              <span className="flex items-center gap-2 font-medium">
                <span className={`size-2 rounded-full ${TONE[role]}`} aria-hidden="true" />
                {ROLE_LABELS[role]}
              </span>
              <span className="font-semibold tabular-nums">{formatNumber(byRole[role] ?? 0)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
