import { cn } from "@brocolis/ui";
import { Badge } from "@brocolis/ui/components/badge";
import { tNetwork } from "@/lib/network-i18n";
import type { StockSource } from "@/lib/network-timeline";
import { STOCK_SOURCE_KEY, STOCK_SOURCE_VARIANT } from "@/lib/network-timeline";

export function StockSourceBadge({
  source,
  className,
}: {
  source: StockSource;
  className?: string;
}) {
  return (
    <Badge variant={STOCK_SOURCE_VARIANT[source]} className={cn(className)}>
      {tNetwork(STOCK_SOURCE_KEY[source])}
    </Badge>
  );
}
