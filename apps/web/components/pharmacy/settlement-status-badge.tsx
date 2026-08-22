import type { SettlementStatus } from "@brocolis/contracts";
import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import {
  SETTLEMENT_STATUS_KEY,
  settlementStatusBadgeVariant,
} from "@/lib/pharmacy-finance";

export function SettlementStatusBadge({
  status,
}: {
  status: SettlementStatus;
}) {
  return (
    <Badge variant={settlementStatusBadgeVariant(status)}>
      {t(SETTLEMENT_STATUS_KEY[status])}
    </Badge>
  );
}
