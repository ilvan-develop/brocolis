"use client";

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
import { useSession } from "@/hooks/use-session";
import { usePharmacyInventory } from "@/lib/pharmacy-query";

export default function PharmacyInventoryPage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const inventoryQuery = usePharmacyInventory(scope);
  const items = inventoryQuery.data ?? [];
  const isLoading = inventoryQuery.isLoading;
  const isError = inventoryQuery.isError;

  const lowStock = items.filter(
    (item) =>
      item.quantityOnHand > 0 && item.quantityOnHand <= item.reorderPoint,
  ).length;
  const outOfStock = items.filter((item) => item.quantityOnHand === 0).length;
  const _totalUnits = items.reduce((sum, item) => sum + item.quantityOnHand, 0);

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
        {isLoading
          ? [
              "pharmacy.inventory.total",
              "pharmacy.inventory.lowStock",
              "pharmacy.inventory.outOfStock",
            ].map((label) => (
              <Card key={label} className="min-w-40">
                <CardHeader className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))
          : [
              {
                label: "pharmacy.inventory.total" as const,
                value: items.length,
              },
              {
                label: "pharmacy.inventory.lowStock" as const,
                value: lowStock,
              },
              {
                label: "pharmacy.inventory.outOfStock" as const,
                value: outOfStock,
              },
            ].map((total) => (
              <Card key={total.label} className="min-w-40">
                <CardHeader className="flex flex-col gap-2">
                  <CardDescription>{t(total.label)}</CardDescription>
                  <CardTitle className="text-3xl font-semibold">
                    {total.value}
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
          {isLoading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-start gap-2">
              <p role="alert" className="text-destructive text-sm">
                Something went wrong
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => inventoryQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
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
                    {t("pharmacy.inventory.quantity")}
                  </th>
                  <th className="py-2 pr-4 font-medium">Reorder point</th>
                  <th className="py-2 font-medium">
                    {t("pharmacy.inventory.alert")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const alert =
                    item.quantityOnHand === 0
                      ? "OUT_OF_STOCK"
                      : item.quantityOnHand <= item.reorderPoint
                        ? "LOW_STOCK"
                        : null;
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td
                        className={cn(
                          "py-2 pr-4 font-medium",
                          alert === "OUT_OF_STOCK" && "text-destructive",
                        )}
                      >
                        {item.productId}
                      </td>
                      <td className="py-2 pr-4">{item.quantityOnHand}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {item.reorderPoint}
                      </td>
                      <td className="py-2">
                        {alert === null ? (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "text-xs font-medium",
                              alert === "OUT_OF_STOCK"
                                ? "text-destructive"
                                : "text-amber-600",
                            )}
                          >
                            {alert === "OUT_OF_STOCK"
                              ? t("pharmacy.inventory.outOfStock")
                              : t("pharmacy.inventory.lowStock")}
                          </span>
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
