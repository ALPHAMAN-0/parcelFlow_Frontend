import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { formatDate, initials } from '@/lib/format';
import { ROLE_LABELS, type Role, type User } from '@/types/api';

const ROLE_STYLES: Record<Role, string> = {
  CUSTOMER:
    'bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25',
  DELIVERY_STAFF:
    'bg-indigo-100 text-indigo-800 ring-indigo-600/20 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-400/25',
  ADMIN:
    'bg-violet-100 text-violet-800 ring-violet-600/20 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/25',
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge className={ROLE_STYLES[role]}>{ROLE_LABELS[role]}</Badge>;
}

export function UsersTable({
  users,
  currentUserId,
  onChangeRole,
}: {
  users: User[];
  currentUserId: string;
  onChangeRole: (user: User) => void;
}) {
  return (
    <TableWrap>
      <Table className="min-w-[38rem]">
        <thead>
          <tr>
            <Th>User</Th>
            <Th>Role</Th>
            <Th>Joined</Th>
            <Th align="right">Action</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <Tr key={user.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="bg-brand-600 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white">
                      {initials(user.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {user.name}
                        {isSelf && <span className="text-muted ml-1.5 font-normal">(you)</span>}
                      </p>
                      <p className="text-muted truncate text-[11px]">{user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <RoleBadge role={user.role} />
                </Td>
                <Td>
                  <span className="text-muted text-[11px] whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </span>
                </Td>
                <Td align="right">
                  {/* Disabled up front rather than letting the API answer 409
                      CANNOT_CHANGE_OWN_ROLE — the rule exists so the last
                      admin cannot lock themselves out. */}
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isSelf}
                    title={isSelf ? 'You cannot change your own role' : undefined}
                    onClick={() => onChangeRole(user)}
                  >
                    Change role
                  </Button>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrap>
  );
}
