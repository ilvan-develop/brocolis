import type { PrescriptionStatus } from "@brocolis/contracts";
import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import {
  PRESCRIPTION_STATUS_KEY,
  prescriptionStatusBadgeVariant,
} from "@/lib/pharmacy-prescriptions";

export function PrescriptionStatusBadge({
  status,
}: {
  status: PrescriptionStatus;
}) {
  return (
    <Badge variant={prescriptionStatusBadgeVariant(status)}>
      {t(PRESCRIPTION_STATUS_KEY[status])}
    </Badge>
  );
}
