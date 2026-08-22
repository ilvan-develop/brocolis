"use client";

import { t } from "@brocolis/i18n";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { computeItemCount } from "@/lib/cart";
import { useCartItems } from "@/lib/storefront-cart";

export function CartLink() {
  const items = useCartItems();
  const count = computeItemCount(items);

  return (
    <Link
      href="/carrinho"
      className="text-muted-foreground relative inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label={`${t("common.cart")} (${count})`}
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
