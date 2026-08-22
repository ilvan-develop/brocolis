import type { PaymentStatus } from "@brocolis/contracts";
import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import {
  paymentStatusBadgeVariant,
  paymentStatusKey,
} from "@/lib/payment-status";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={paymentStatusBadgeVariant(status)}>
      {t(paymentStatusKey(status))}
    </Badge>
  );
}
