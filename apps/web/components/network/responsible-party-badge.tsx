import { cn } from "@brocolis/ui";
import { Badge } from "@brocolis/ui/components/badge";
import { tNetwork } from "@/lib/network-i18n";
import type { ResponsibleParty } from "@/lib/network-timeline";
import {
  RESPONSIBLE_PARTY_KEY,
  RESPONSIBLE_PARTY_VARIANT,
} from "@/lib/network-timeline";

export function ResponsiblePartyBadge({
  party,
  className,
}: {
  party: ResponsibleParty;
  className?: string;
}) {
  return (
    <Badge variant={RESPONSIBLE_PARTY_VARIANT[party]} className={cn(className)}>
      {tNetwork(RESPONSIBLE_PARTY_KEY[party])}
    </Badge>
  );
}
