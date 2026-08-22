"use client";

import { formatCurrency } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import { Button } from "@brocolis/ui/components/button";
import { Card, CardContent } from "@brocolis/ui/components/card";
import { Separator } from "@brocolis/ui/components/separator";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  lowestPriceOf,
  mapOfferToDisplay,
  STOCK_TIER_KEY,
  stockBadgeVariant,
} from "@/lib/product";
import { useProductDetail } from "@/lib/query";
import { addItemToCart } from "@/lib/storefront-cart";

export function ProductClient({ productId }: { productId: string }) {
  const { product, offers, isLoading, isError } = useProductDetail(productId);
  const price = lowestPriceOf(offers);
  const anyPrescription = offers.some((offer) => offer.prescriptionRequired);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        {t("catalog.error")}
      </p>
    );
  }

  if (product === null) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        {t("catalog.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-muted-foreground inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" />
          {t("orders.confirmation.back")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {product.name}
        </h1>
        {price !== null && (
          <p className="text-xl font-semibold">
            <span className="text-muted-foreground text-sm font-normal">
              {t("product.lowestPrice")}:{" "}
            </span>
            {formatCurrency(price.amount, price.currency)}
          </p>
        )}
        <Badge
          variant={anyPrescription ? "destructive" : "outline"}
          className="w-fit"
        >
          {anyPrescription
            ? t("storefront.prescriptionRequired")
            : t("prescription.notRequired")}
        </Badge>
      </div>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("product.offers")}</h2>
        {offers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("product.offers.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {offers.map((offer) => {
              const display = mapOfferToDisplay(offer);
              return (
                <Card key={offer.id}>
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-muted-foreground text-sm">
                      {offer.pharmacyId}
                    </p>
                    <p className="text-lg font-semibold">
                      {display.priceLabel}
                    </p>
                    <Badge
                      variant={stockBadgeVariant(display.tier)}
                      className="w-fit"
                    >
                      {t(STOCK_TIER_KEY[display.tier])}
                    </Badge>
                    {display.prescriptionRequired && (
                      <p className="text-muted-foreground text-sm">
                        {t("storefront.prescriptionRequired")}
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="w-fit"
                      disabled={!display.available}
                      onClick={() => {
                        addItemToCart({
                          productId: offer.productId,
                          pharmacyId: offer.pharmacyId,
                          quantity: 1,
                          unitPrice: offer.priceMoney,
                        });
                        toast.success(t("storefront.addedToCart"));
                      }}
                    >
                      <Plus />
                      {t("common.cart.add")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
