"use client";

import { t } from "@brocolis/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useSession } from "@/hooks/use-session";
import { usePharmacyOrders } from "@/lib/pharmacy-query";

export default function PharmacyCustomersPage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const ordersQuery = usePharmacyOrders(scope);
  const orders = ordersQuery.data ?? [];

  const customerIds = new Set(
    orders.map((order) => order.customerId).filter(Boolean),
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.customers.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.customers.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{customerIds.size}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("pharmacy.orders.total")}</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{orders.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pharmacy.customers.title")}</CardTitle>
          <CardDescription>{t("pharmacy.customers.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersQuery.isLoading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : customerIds.size === 0 ? (
            <p className="text-muted-foreground text-sm">No customers yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {[...customerIds].map((customerId) => (
                <div
                  key={customerId}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span className="text-sm font-medium">{customerId}</span>
                  <span className="text-muted-foreground text-xs">
                    {orders.filter((o) => o.customerId === customerId).length}{" "}
                    {t("pharmacy.orders.title")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
