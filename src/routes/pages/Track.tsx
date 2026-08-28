import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrackingCodeInput } from '@/components/parcels/TrackingCodeInput';
import { useAuth } from '@/hooks/useAuth';
import { isValidTrackingCode } from '@/domain/trackingCode';

const SCOPE_NOTE: Record<string, string> = {
  CUSTOMER: 'You can look up parcels you created.',
  DELIVERY_STAFF: 'You can look up parcels assigned to you.',
  ADMIN: 'You can look up any parcel.',
};

export function TrackPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validated locally first: a malformed code is a guaranteed 422, and the
    // lookup endpoint is rate limited to 60/min.
    if (!isValidTrackingCode(code)) {
      setError('Enter a complete tracking code, e.g. PF-YUH5F-P6VFX.');
      return;
    }
    setError(null);
    navigate(`/parcels/${code}`);
  }

  return (
    <>
      <PageHeader
        title="Track a parcel"
        description="Enter a tracking code to see its current status and full history."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <TrackingCodeInput value={code} onChange={setCode} error={error ?? undefined} autoFocus />
              <Button type="submit" disabled={!isValidTrackingCode(code)}>
                Track parcel
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card as="aside">
          <CardBody className="space-y-3 text-xs leading-relaxed">
            <div>
              <h2 className="text-xs font-semibold">Who can see what</h2>
              <p className="text-muted mt-1.5">{role ? SCOPE_NOTE[role] : ''}</p>
              <p className="text-muted mt-1.5">
                A code outside your scope returns "not found" rather than "forbidden" — telling you
                it exists would itself leak information.
              </p>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-3">
              <h2 className="text-xs font-semibold">Reading a code</h2>
              <p className="text-muted mt-1.5">
                Codes look like <span className="font-mono">PF-XXXXX-XXXXX</span>. The letters I and
                O and the digits 0 and 1 never appear, so there is nothing on a printed label that
                can be misread. Case does not matter, and the dashes are typed for you.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
