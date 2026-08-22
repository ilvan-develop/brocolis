"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Card, CardContent } from "@brocolis/ui/components/card";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

type StepConfirmationProps = {
  orderId: string | null;
};

export function StepConfirmation({ orderId }: StepConfirmationProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <h2 className="text-xl font-semibold">
          {t("orders.confirmation.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("orders.confirmation.description")}
        </p>
        <OrderStatusBadge status="PENDING" />
        <p className="text-sm">
          <span className="text-muted-foreground">
            {t("orders.reference")}:{" "}
          </span>
          <span className="font-semibold">{orderId ?? "—"}</span>
        </p>
        <Button asChild>
          <Link href="/">{t("orders.confirmation.back")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
