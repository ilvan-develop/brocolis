"use client";

import { tF6 } from "@brocolis/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Badge } from "@brocolis/ui/components/badge";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useNetworkTimeline } from "@/lib/network-query";
import { NETWORK_STAGE_KEY, NETWORK_STATUS_KEY, NETWORK_STATUS_VARIANT, type NetworkStageStatus, type NetworkStageName } from "@/lib/network-timeline";

export default function NetworkPage() {
  const { stages, isLoading, isError, refetch } = useNetworkTimeline();

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tF6("b2b2c.title")}
        </h1>
        <p className="text-muted-foreground text-sm">{tF6("b2b2c.subtitle")}</p>
      </header>

      {isError ? (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p role="alert" className="text-destructive text-sm">
              {tF6("network.timeline.title")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm underline"
            >
              {tF6("network.timeline.title")}
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{tF6("network.timeline.title")}</CardTitle>
            <CardDescription>
              {tF6("b2b2c.flow.consumer_order")} →{" "}
              {tF6("b2b2c.flow.pharmacy_confirmation")} →{" "}
              {tF6("b2b2c.flow.supplier_pull")} →{" "}
              {tF6("b2b2c.flow.delivery")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-4" aria-busy="true">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {stages.map((stage) => (
                  <div
                    key={stage.stage}
                    className="flex items-center gap-3 rounded-md border p-3"
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-sm font-medium">
                        {tF6(NETWORK_STAGE_KEY[stage.stage as NetworkStageName])}
                      </span>
                      <span className="text-muted-foreground text-xs">
                         {stage.owner} · {tF6(NETWORK_STATUS_KEY[stage.status as NetworkStageStatus])}
                      </span>
                    </div>
                    <Badge variant={NETWORK_STATUS_VARIANT[stage.status as NetworkStageStatus]}>
                      {tF6(NETWORK_STATUS_KEY[stage.status as NetworkStageStatus])}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
