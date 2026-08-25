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

export default function PharmacyDeliveryPage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const ordersQuery = usePharmacyOrders(scope);
  const orders = ordersQuery.data ?? [];

  const inTransit = orders.filter(
    (order) => order.status === "IN_TRANSIT",
  ).length;
  const delivered = orders.filter(
    (order) => order.status === "DELIVERED",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.delivery.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.delivery.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>In Transit</CardTitle>
            <CardDescription>Orders currently being delivered</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{inTransit}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Delivered</CardTitle>
            <CardDescription>Orders successfully delivered</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{delivered}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
