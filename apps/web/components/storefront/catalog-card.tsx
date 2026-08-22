"use client";

import type { MarketOffer } from "@brocolis/contracts";
import { formatCurrency } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import { Button } from "@brocolis/ui/components/button";
import { Card, CardContent, CardFooter } from "@brocolis/ui/components/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { CatalogRow } from "@/lib/catalog-mapper";
import {
  lowestPriceOf,
  STOCK_TIER_KEY,
  stockBadgeVariant,
  stockTier,
} from "@/lib/product";
import { bestOffer } from "@/lib/storefront";
import { addItemToCart } from "@/lib/storefront-cart";

type CatalogCardProps = {
  row: CatalogRow;
  offers: readonly MarketOffer[];
};

export function CatalogCard({ row, offers }: CatalogCardProps) {
  const offer = bestOffer(offers);
  const price = offer?.priceMoney ?? lowestPriceOf(offers) ?? row.price;
  const tier = stockTier(row.totalStock);
  const available = offer !== null;

  function handleAdd() {
    if (offer === null) {
      return;
    }
    addItemToCart({
      productId: offer.productId,
      pharmacyId: offer.pharmacyId,
      quantity: 1,
      unitPrice: offer.priceMoney,
    });
    toast.success(t("storefront.addedToCart"));
  }

  return (
    <Card className="flex flex-col gap-4">
      <CardContent className="flex flex-col gap-2">
        <p className="font-semibold">{row.name}</p>
        {row.brand.length > 0 && (
          <p className="text-muted-foreground text-sm">{row.brand}</p>
        )}
        <Badge variant={stockBadgeVariant(tier)} className="w-fit">
          {t(STOCK_TIER_KEY[tier])}
        </Badge>
        <p className="text-xl font-semibold">
          {formatCurrency(price.amount, price.currency)}
        </p>
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/producto/${row.productId}`}>
            {t("storefront.viewProduct")}
          </Link>
        </Button>
        <Button size="sm" onClick={handleAdd} disabled={!available}>
          <Plus />
          {t("common.cart.add")}
        </Button>
      </CardFooter>
    </Card>
  );
}
