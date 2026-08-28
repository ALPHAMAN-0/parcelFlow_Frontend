import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreateParcelForm } from '@/components/parcels/CreateParcelForm';
import { useAuth } from '@/hooks/useAuth';

export function NewParcelPage() {
  const { user, role } = useAuth();

  return (
    <>
      <PageHeader
        title="New parcel"
        description="Creates the parcel in Pending with a generated tracking code, and writes its first history row in the same transaction."
        actions={
          <Link to="/parcels">
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            {/* Prefilled with the signed-in customer's name, since they are
                usually the sender. Admins get a blank field: they create on
                someone else's behalf. */}
            <CreateParcelForm defaultSenderName={role === 'CUSTOMER' ? user?.name : undefined} />
          </CardBody>
        </Card>

        <Card as="aside">
          <CardHeader title="What happens next" />
          <CardBody className="space-y-3 text-xs leading-relaxed">
            <ol className="space-y-2.5">
              {[
                'The parcel is created as Pending and given a tracking code.',
                'An admin assigns a delivery staff member to it.',
                'That courier advances it: Picked Up, In Transit, Out for Delivery, Delivered.',
                'Every one of those changes is recorded with who made it and when.',
              ].map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="surface-sunken text-muted flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-muted">{step}</span>
                </li>
              ))}
            </ol>

            {role === 'ADMIN' && (
              <p className="surface-sunken rounded-lg p-2.5 text-[11px]">
                You are creating this as an admin, so the parcel will be owned by your account rather
                than by a customer.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
