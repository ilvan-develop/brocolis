import { t } from "@brocolis/i18n";
import { cn } from "@brocolis/ui";
import { Badge } from "@brocolis/ui/components/badge";
import type { PharmacyDeliveryStatus } from "@/lib/pharmacy-delivery";
import {
  DELIVERY_STATUS_KEY,
  deliveryStatusBadgeVariant,
} from "@/lib/pharmacy-delivery";

export function DeliveryStatusBadge({
  status,
  className,
}: {
  status: PharmacyDeliveryStatus;
  className?: string;
}) {
  return (
    <Badge
      variant={deliveryStatusBadgeVariant(status)}
      className={cn(className)}
    >
      {t(DELIVERY_STATUS_KEY[status])}
    </Badge>
  );
}
