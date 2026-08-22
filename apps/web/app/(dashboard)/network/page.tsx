"use client";

import { tF6 } from "@brocolis/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Skeleton } from "@brocolis/ui/components/skeleton";

const stages = [
  { key: "CONSUMER_ORDER" as const, icon: "🛒" },
  { key: "PHARMACY_CONFIRMATION" as const, icon: "💊" },
  { key: "SUPPLIER_PULL" as const, icon: "📦" },
  { key: "DELIVERY" as const, icon: "🚚" },
];

export default function NetworkPage() {
  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tF6("b2b2c.title")}
        </h1>
        <p className="text-muted-foreground text-sm">{tF6("b2b2c.subtitle")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{tF6("network.timeline.title")}</CardTitle>
          <CardDescription>
            {tF6("b2b2c.flow.consumer_order")} →{" "}
            {tF6("b2b2c.flow.pharmacy_confirmation")} →{" "}
            {tF6("b2b2c.flow.supplier_pull")} → {tF6("b2b2c.flow.delivery")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {stages.map((stage) => (
              <div
                key={stage.key}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                <span className="text-lg">{stage.icon}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {tF6(
                      `b2b2c.flow.${stage.key.toLowerCase()}` as Parameters<
                        typeof tF6
                      >[0],
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {tF6("network.status.pending")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tF6("network.sla.label")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
