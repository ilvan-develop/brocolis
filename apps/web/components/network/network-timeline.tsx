"use client";

import { cn } from "@brocolis/ui";
import { Badge } from "@brocolis/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Separator } from "@brocolis/ui/components/separator";
import { ResponsiblePartyBadge } from "@/components/network/responsible-party-badge";
import { tNetwork } from "@/lib/network-i18n";
import type { NetworkStage } from "@/lib/network-timeline";
import {
  hasSupplierPull,
  NETWORK_STAGE_KEY,
  NETWORK_STATUS_KEY,
  NETWORK_STATUS_VARIANT,
  visibleStages,
} from "@/lib/network-timeline";

type NetworkTimelineProps = {
  stages: readonly NetworkStage[];
  showSupplier?: boolean;
};

export function NetworkTimeline({
  stages,
  showSupplier,
}: NetworkTimelineProps) {
  const visible = visibleStages(stages, showSupplier ?? false);
  const hiddenSupplier = hasSupplierPull(stages) && !showSupplier;

  return (
    <Card className="flex flex-col gap-2">
      <CardHeader>
        <CardTitle className="text-base">
          {tNetwork("network.timeline.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ol className="m-0 flex list-none flex-col gap-0 p-0">
          {visible.map((stage, index) => {
            const breached = stage.status === "DELAYED";
            return (
              <li key={stage.stage} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1 size-3 shrink-0 rounded-full",
                      stage.status === "COMPLETED" && "bg-primary",
                      stage.status === "IN_PROGRESS" && "bg-primary/50",
                      stage.status === "PENDING" && "bg-muted",
                      breached && "bg-destructive",
                    )}
                  />
                  {index < visible.length - 1 && (
                    <span
                      aria-hidden
                      className={cn(
                        "w-px grow",
                        breached ? "bg-destructive/40" : "bg-border",
                      )}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1 pb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {tNetwork(NETWORK_STAGE_KEY[stage.stage])}
                    </p>
                    <ResponsiblePartyBadge party={stage.responsibleParty} />
                    <Badge variant={NETWORK_STATUS_VARIANT[stage.status]}>
                      {tNetwork(NETWORK_STATUS_KEY[stage.status])}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{stage.owner}</p>
                  <p
                    className={cn(
                      "text-muted-foreground text-xs",
                      breached && "text-destructive font-medium",
                    )}
                  >
                    {breached
                      ? tNetwork("network.sla.breached")
                      : tNetwork("network.sla.label")}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        {hiddenSupplier && (
          <>
            <Separator />
            <p className="text-muted-foreground text-xs">
              {tNetwork("network.supplier.hidden")}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
