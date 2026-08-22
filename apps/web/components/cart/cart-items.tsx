"use client";

import { formatCurrency } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Card, CardContent, CardFooter } from "@brocolis/ui/components/card";
import { Separator } from "@brocolis/ui/components/separator";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import {
  computeItemCount,
  computeSubtotal,
  MAX_ITEM_QUANTITY,
  MIN_ITEM_QUANTITY,
} from "@/lib/cart";
import { useCatalog } from "@/lib/query";
import {
  removeCartItem,
  setCartItemQuantity,
  useCartItems,
} from "@/lib/storefront-cart";
import { QuantityControl } from "./quantity-control";

export function CartItems() {
  const items = useCartItems();
  const catalog = useCatalog();
  const subtotal = computeSubtotal(items);
  const count = computeItemCount(items);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground text-sm">{t("cart.empty")}</p>
          <Button asChild variant="outline">
            <Link href="/">{t("cart.continueShopping")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {items.map((item) => {
          const product = catalog.data.products.find(
            (candidate) => candidate.id === item.productId,
          );
          const name = product?.name ?? item.productId;
          return (
            <div
              key={`${item.productId}:${item.pharmacyId}`}
              className="flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{name}</p>
                <p className="text-muted-foreground text-sm">
                  {formatCurrency(
                    item.unitPrice.amount,
                    item.unitPrice.currency,
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <QuantityControl
                  quantity={item.quantity}
                  max={MAX_ITEM_QUANTITY}
                  onDecrease={() => {
                    if (item.quantity <= MIN_ITEM_QUANTITY) {
                      removeCartItem(item.productId, item.pharmacyId);
                    } else {
                      setCartItemQuantity(
                        item.productId,
                        item.pharmacyId,
                        item.quantity - 1,
                      );
                    }
                  }}
                  onIncrease={() =>
                    setCartItemQuantity(
                      item.productId,
                      item.pharmacyId,
                      item.quantity + 1,
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    removeCartItem(item.productId, item.pharmacyId)
                  }
                  aria-label={t("cart.remove")}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          );
        })}

        <Separator />

        <div className="flex flex-col gap-1 text-sm">
          <p className="text-muted-foreground">
            {count} {t("cart.itemCount")}
          </p>
          <p className="flex items-center justify-between">
            <span className="font-medium">{t("cart.subtotal")}</span>
            <span className="font-semibold">
              {formatCurrency(subtotal.amount, subtotal.currency)}
            </span>
          </p>
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-4">
        <Button asChild variant="outline">
          <Link href="/">{t("cart.continueShopping")}</Link>
        </Button>
        <Button asChild>
          <Link href="/checkout">{t("cart.gotoCheckout")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
