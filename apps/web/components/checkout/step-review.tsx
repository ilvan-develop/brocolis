"use client";

import type { CartItem, Money } from "@brocolis/contracts";
import { formatCurrency } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Card, CardContent } from "@brocolis/ui/components/card";
import { Separator } from "@brocolis/ui/components/separator";
import { type CheckoutState, PAYMENT_METHOD_KEY } from "@/lib/checkout";
import { useCatalog } from "@/lib/query";

export const VAT_RATE = 0.14;

type StepReviewProps = {
  state: CheckoutState;
  items: readonly CartItem[];
  subtotal: Money;
  submitting: boolean;
  onPlaceOrder: () => void;
};

export function StepReview({
  state,
  items,
  subtotal,
  submitting,
  onPlaceOrder,
}: StepReviewProps) {
  const catalog = useCatalog();
  const vat = Math.round(subtotal.amount * VAT_RATE);
  const total = subtotal.amount + vat;
  const currency = subtotal.currency;
  const zoneKey =
    state.delivery?.zone === "suburban"
      ? "delivery.zone.suburban"
      : "delivery.zone.urban";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <section className="flex flex-col gap-1 text-sm">
          <h3 className="font-semibold">{t("checkout.client.title")}</h3>
          <p className="text-muted-foreground">{state.client?.fullName}</p>
          <p className="text-muted-foreground">{state.client?.phone}</p>
        </section>

        <Separator />

        <section className="flex flex-col gap-1 text-sm">
          <h3 className="font-semibold">{t("delivery.title")}</h3>
          <p className="text-muted-foreground">{t(zoneKey)}</p>
          <p className="text-muted-foreground">
            {state.delivery?.street}, {state.delivery?.houseNumber}
          </p>
        </section>

        <Separator />

        <section className="flex flex-col gap-1 text-sm">
          <h3 className="font-semibold">{t("pharmacy.select")}</h3>
          <p className="text-muted-foreground">{state.pharmacy?.pharmacyId}</p>
        </section>

        <Separator />

        <section className="flex flex-col gap-1 text-sm">
          <h3 className="font-semibold">{t("payment.title")}</h3>
          {state.payment !== null && (
            <p className="text-muted-foreground">
              {t(PAYMENT_METHOD_KEY[state.payment.method])}
            </p>
          )}
        </section>

        <Separator />

        <section className="flex flex-col gap-2">
          {items.map((item) => {
            const product = catalog.data.products.find(
              (candidate) => candidate.id === item.productId,
            );
            const name = product?.name ?? item.productId;
            return (
              <div
                key={`${item.productId}:${item.pharmacyId}`}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <p className="min-w-0 flex-1 truncate">
                  {item.quantity}× {name}
                </p>
                <p className="font-medium">
                  {formatCurrency(
                    item.unitPrice.amount * item.quantity,
                    item.unitPrice.currency,
                  )}
                </p>
              </div>
            );
          })}
          <Separator />
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
              <dd>{formatCurrency(subtotal.amount, currency)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t("order.vat")}</dt>
              <dd>{formatCurrency(vat, currency)}</dd>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <dt>{t("order.total")}</dt>
              <dd>{formatCurrency(total, currency)}</dd>
            </div>
          </dl>
        </section>
      </CardContent>
      <div className="px-6 pb-6">
        <Button onClick={onPlaceOrder} disabled={submitting} className="w-full">
          {t("checkout.placeOrder")}
        </Button>
      </div>
    </Card>
  );
}
