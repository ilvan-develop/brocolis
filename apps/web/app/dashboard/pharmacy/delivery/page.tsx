"use client";

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
import { DeliveryStatusBadge } from "@/components/pharmacy/delivery-status-badge";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import {
  DEMO_PHARMACY_DELIVERIES,
  deliveryEtaLabel,
  type PharmacyDelivery,
} from "@/lib/pharmacy-delivery";
import { deliveryZoneLabelKey } from "@/lib/pharmacy-orders";

export default function PharmacyDeliveryPage() {
  const loading = useSimulatedLoad();
  const [deliveries] = useState<PharmacyDelivery[]>(() => [
    ...DEMO_PHARMACY_DELIVERIES,
  ]);
  const [error, setError] = useState<string | null>(null);

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

      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>{t("pharmacy.delivery.title")}</CardTitle>
          <CardDescription>{t("pharmacy.delivery.subtitle")}</CardDescription>
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
          ) : deliveries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("pharmacy.delivery.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">{t("order.title")}</th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.orders.customer")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.orders.workspace.zone")}
                  </th>
                  <th className="py-2 pr-4 font-medium">{t("delivery.fee")}</th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.delivery.eta")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.delivery.address")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.delivery.status")}
                  </th>
                  <th className="py-2 font-medium">
                    {t("pharmacy.delivery.driver")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">
                      {delivery.orderNumber}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {delivery.customerName}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {t(deliveryZoneLabelKey(delivery.zone))}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatCurrency(
                        delivery.fee.amount,
                        delivery.fee.currency,
                      )}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {delivery.etaMinutes > 0
                        ? deliveryEtaLabel(delivery.etaMinutes)
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {delivery.addressLine}, {delivery.city}
                    </td>
                    <td className="py-2 pr-4">
                      <DeliveryStatusBadge status={delivery.status} />
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {delivery.driverName ?? "—"}
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
