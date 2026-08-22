import { t } from "@brocolis/i18n";
import type { Metadata } from "next";
import { CartItems } from "@/components/cart/cart-items";

export const metadata: Metadata = {
  title: "Carrinho — Brócolis",
};

export default function CartPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("cart.title")}
      </h1>
      <CartItems />
    </div>
  );
}
