"use client";

import { formatDate } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import { cn } from "@brocolis/ui";
import { Button } from "@brocolis/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useState } from "react";
import { InventoryAlertBadge } from "@/components/pharmacy/inventory-alert-badge";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import {
  availableOf,
  DEFAULT_INVENTORY_THRESHOLDS,
  DEMO_PHARMACY_INVENTORY,
  inventoryAlertFor,
  inventoryTotals,
  type PharmacyInventoryRow,
} from "@/lib/pharmacy-inventory";

const TOTALS: readonly {
  label:
    | "pharmacy.inventory.total"
    | "pharmacy.inventory.lowStock"
    | "pharmacy.inventory.outOfStock"
    | "pharmacy.inventory.expiring"
    | "pharmacy.inventory.expired";
  value: (totals: ReturnType<typeof inventoryTotals>) => number;
}[] = [
  { label: "pharmacy.inventory.total", value: (totals) => totals.items },
  { label: "pharmacy.inventory.lowStock", value: (totals) => totals.lowStock },
  {
    label: "pharmacy.inventory.outOfStock",
    value: (totals) => totals.outOfStock,
  },
  { label: "pharmacy.inventory.expiring", value: (totals) => totals.expiring },
  { label: "pharmacy.inventory.expired", value: (totals) => totals.expired },
];

export default function PharmacyInventoryPage() {
  const loading = useSimulatedLoad();
  const [rows] = useState<PharmacyInventoryRow[]>(() => [
    ...DEMO_PHARMACY_INVENTORY,
  ]);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const totals = inventoryTotals(rows, now, DEFAULT_INVENTORY_THRESHOLDS);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.inventory.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.inventory.subtitle")}
        </p>
      </header>

      <div className="flex flex-wrap gap-4">
        {loading
          ? TOTALS.map((total) => (
              <Card key={total.label} className="min-w-40">
                <CardHeader className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))
          : TOTALS.map((total) => (
              <Card key={total.label} className="min-w-40">
                <CardHeader className="flex flex-col gap-2">
                  <CardDescription>{t(total.label)}</CardDescription>
                  <CardTitle className="text-3xl font-semibold">
                    {total.value(totals)}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>{t("pharmacy.inventory.totals")}</CardTitle>
          <CardDescription>{t("pharmacy.inventory.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error !== null ? (
            <div className="flex flex-col items-start gap-2">
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
              >
                {t("catalog.retry")}
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("pharmacy.inventory.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.catalog.product")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.inventory.batch")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.inventory.expiry")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.inventory.quantity")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.inventory.reserved")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.inventory.available")}
                  </th>
                  <th className="py-2 font-medium">
                    {t("pharmacy.inventory.alert")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const alert = inventoryAlertFor(
                    row,
                    now,
                    DEFAULT_INVENTORY_THRESHOLDS,
                  );
                  const expired = alert === "EXPIRED";
                  return (
                    <tr key={row.itemId} className="border-b last:border-0">
                      <td
                        className={cn(
                          "py-2 pr-4 font-medium",
                          expired && "text-destructive",
                        )}
                      >
                        {row.productName}
                      </td>
                      <td
                        className={cn(
                          "py-2 pr-4 text-muted-foreground",
                          expired && "text-destructive",
                        )}
                      >
                        {row.batchNumber}
                      </td>
                      <td
                        className={cn(
                          "py-2 pr-4",
                          expired && "text-destructive",
                        )}
                      >
                        {formatDate(row.expiryDate)}
                      </td>
                      <td className="py-2 pr-4">{row.quantityOnHand}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {row.reserved}
                      </td>
                      <td className="py-2 pr-4">{availableOf(row)}</td>
                      <td className="py-2">
                        {alert === null ? (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        ) : (
                          <InventoryAlertBadge type={alert} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
