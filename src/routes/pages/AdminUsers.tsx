import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { UsersTable } from '@/components/admin/UsersTable';
import { RoleChangeDialog } from '@/components/admin/RoleChangeDialog';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useDebounced } from '@/hooks/useDebounced';
import { ROLES, ROLE_LABELS, type Role, type User, type UserListQuery } from '@/types/api';

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [target, setTarget] = useState<User | null>(null);

  const role = searchParams.get('role') ?? '';
  const search = searchParams.get('search') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

  const debouncedSearch = useDebounced(search, 400);

  const query = useMemo<UserListQuery>(
    () => ({
      role: (role || undefined) as Role | undefined,
      // Omitted when empty: `?search=` would fail the min(1) check with a 422.
      search: debouncedSearch.trim() || undefined,
      page,
      limit: 20,
    }),
    [role, debouncedSearch, page],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminUsers(query);

  function update(next: { role?: string; search?: string }) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page'); // a new filter invalidates the current page number
    setSearchParams(params, { replace: true });
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));
    setSearchParams(params);
  }

  const users = data?.items ?? [];
  const filtered = Boolean(role || search);

  return (
    <>
      <PageHeader
        title="Users"
        description="Every account on the system. Changing someone to or from delivery staff also moves their parcel assignments."
      />

      <Card className="mb-4">
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <Select label="Role" value={role} onChange={(e) => update({ role: e.target.value })}>
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>

          <Input
            label="Search"
            value={search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Name or email"
            hint="Matches either field, any case"
            maxLength={100}
            autoComplete="off"
          />

          {filtered && (
            <div className="flex items-end pb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <SkeletonRows rows={5} cols={4} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users match"
            description="Try a different role, or a shorter search term."
          />
        ) : (
          <>
            <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <UsersTable
                users={users}
                currentUserId={currentUser?.id ?? ''}
                onChangeRole={setTarget}
              />
            </div>
            {data && <Pagination meta={data.meta} onPageChange={goToPage} isLoading={isFetching} />}
          </>
        )}
      </Card>

      <RoleChangeDialog user={target} open={target !== null} onClose={() => setTarget(null)} />
    </>
  );
}
