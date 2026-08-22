import { t } from "@brocolis/i18n";
import type { Metadata } from "next";
import { CheckoutWizard } from "@/components/checkout/checkout-wizard";

export const metadata: Metadata = {
  title: "Checkout — Brócolis",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("checkout.title")}
      </h1>
      <CheckoutWizard />
    </div>
  );
}
