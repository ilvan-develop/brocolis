import type { OrderStatus } from "@brocolis/contracts";
import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import { orderStatusBadgeVariant, orderStatusKey } from "@/lib/order-status";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={orderStatusBadgeVariant(status)}>
      {t(orderStatusKey(status))}
    </Badge>
  );
}
