import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import type { PharmacyOrder } from "@/lib/pharmacy-orders";
import { orderPrescriptionBadgeKey } from "@/lib/pharmacy-orders";

export function OrderPrescriptionBadge({
  prescription,
}: {
  prescription: PharmacyOrder["prescription"];
}) {
  const key = orderPrescriptionBadgeKey(prescription);
  const variant =
    key === "pharmacy.orders.prescription.approved" ? "default" : "secondary";
  return <Badge variant={variant}>{t(key)}</Badge>;
}
