import { Badge } from '@/components/ui/Badge';
import { STATUS_LABELS, STATUS_STYLES, type ParcelStatusValue } from '@/domain/parcelStatus';

export function StatusBadge({ status }: { status: ParcelStatusValue }) {
  const style = STATUS_STYLES[status];
  return (
    <Badge className={style.badge} dot={style.dot}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
