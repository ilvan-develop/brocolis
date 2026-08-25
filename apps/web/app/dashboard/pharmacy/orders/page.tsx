"use client";

import type { Order } from "@brocolis/contracts";
import { formatCurrency } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
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
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { useSession } from "@/hooks/use-session";
import { usePharmacyOrders } from "@/lib/pharmacy-query";

const TABS = [
  { key: "all", label: "pharmacy.orders.tab.all" },
  { key: "pending", label: "pharmacy.orders.tab.new" },
  { key: "processing", label: "pharmacy.orders.tab.preparing" },
  { key: "delivered", label: "pharmacy.orders.tab.delivered" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function filterOrdersByTab(orders: Order[], tab: TabKey): Order[] {
  if (tab === "all") return orders;
  return orders.filter(
    (order) => order.status.toUpperCase() === tab.toUpperCase(),
  );
}

export default function PharmacyOrdersPage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const ordersQuery = usePharmacyOrders(scope);
  const [tab, setTab] = useState<TabKey>("all");

  const orders = ordersQuery.data ?? [];
  const filtered = filterOrdersByTab(orders, tab);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.orders.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.orders.subtitle")}
        </p>
      </header>

      <div className="flex gap-2">
        {TABS.map((tabItem) => (
          <Button
            key={tabItem.key}
            variant={tab === tabItem.key ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTab(tabItem.key)}
          >
            {t(tabItem.label)}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pharmacy.orders.title")}</CardTitle>
          <CardDescription>{t("pharmacy.orders.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersQuery.isLoading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : ordersQuery.isError ? (
            <div className="flex flex-col items-start gap-2">
              <p role="alert" className="text-destructive text-sm">
                Something went wrong
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => ordersQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("pharmacy.orders.empty")}
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
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{order.id}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {order.customerId ?? "-"}
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
