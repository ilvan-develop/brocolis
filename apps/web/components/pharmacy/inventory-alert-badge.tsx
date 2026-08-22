import type { InventoryAlertType } from "@brocolis/contracts";
import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import {
  INVENTORY_ALERT_KEY,
  inventoryAlertBadgeVariant,
} from "@/lib/pharmacy-inventory";

export function InventoryAlertBadge({ type }: { type: InventoryAlertType }) {
  return (
    <Badge variant={inventoryAlertBadgeVariant(type)}>
      {t(INVENTORY_ALERT_KEY[type])}
    </Badge>
  );
}
