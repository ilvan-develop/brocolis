"use client";

import { formatCurrency } from "@brocolis/formatters";
import { type MessageKey, t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import Link from "next/link";
import { useState } from "react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import {
  derivePharmacyKpis,
  type PharmacyDashboardKpis,
} from "@/lib/pharmacy-dashboard";
import { DEMO_PHARMACY_SETTLEMENTS } from "@/lib/pharmacy-finance";
import { DEMO_PHARMACY_INVENTORY } from "@/lib/pharmacy-inventory";
import { DEMO_PHARMACY_ORDERS } from "@/lib/pharmacy-orders";

const KPI_KEYS: readonly {
  label: MessageKey;
  value: (kpis: PharmacyDashboardKpis) => string;
}[] = [
  { label: "pharmacy.overview.kpi.orders", value: (k) => String(k.orderCount) },
  {
    label: "pharmacy.overview.kpi.sales",
    value: (k) => formatCurrency(k.salesMinor, k.salesCurrency),
  },
  { label: "pharmacy.overview.kpi.stock", value: (k) => `${k.stockPct}%` },
  {
    label: "pharmacy.overview.kpi.pendingSettlements",
    value: (k) => String(k.pendingSettlements),
  },
];

export default function PharmacyOverviewPage() {
  const loading = useSimulatedLoad();
  const [orders] = useState(() => [...DEMO_PHARMACY_ORDERS]);
  const [inventory] = useState(() => [...DEMO_PHARMACY_INVENTORY]);
  const [settlements] = useState(() => [...DEMO_PHARMACY_SETTLEMENTS]);

  const kpis = derivePharmacyKpis(orders, inventory, settlements);
  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.overview.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.overview.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? KPI_KEYS.map((kpi) => (
              <Card key={kpi.label}>
                <CardHeader className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </CardHeader>
              </Card>
            ))
          : KPI_KEYS.map((kpi) => (
              <Card key={kpi.label}>
                <CardHeader className="flex flex-col gap-2">
                  <CardDescription>{t(kpi.label)}</CardDescription>
                  <CardTitle className="text-3xl font-semibold">
                    {kpi.value(kpis)}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>{t("pharmacy.overview.recentOrders")}</CardTitle>
            <CardDescription>{t("pharmacy.orders.subtitle")}</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/pharmacy/orders">
              {t("pharmacy.overview.viewAll")}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("pharmacy.overview.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.orders.number")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.orders.customer")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.orders.total")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.orders.status")}
                  </th>
                  <th className="py-2 font-medium">
                    {t("pharmacy.orders.items")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{order.number}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {order.customerName}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatCurrency(
                        order.totals.total.amount,
                        order.totals.total.currency,
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="text-muted-foreground py-2">
                      {order.items.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
