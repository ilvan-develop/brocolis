"use client";

import type { PaymentMethod } from "@brocolis/contracts";
import { t } from "@brocolis/i18n";
import { cn } from "@brocolis/ui";
import { Button } from "@brocolis/ui/components/button";
import { type FormEvent, useState } from "react";
import { PAYMENT_METHOD_KEY } from "@/lib/checkout";

const METHODS: readonly PaymentMethod[] = [
  "CARD",
  "WALLET",
  "REFERENCE",
  "COD",
  "MOBILE",
];

type StepPaymentProps = {
  method: PaymentMethod | null;
  onCommit: (method: PaymentMethod) => void;
};

export function StepPayment({ method, onCommit }: StepPaymentProps) {
  const [selected, setSelected] = useState<PaymentMethod | null>(method);
  const [confirmed, setConfirmed] = useState(method !== null);
  const canSubmit = selected !== null && confirmed;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected !== null && confirmed) {
      onCommit(selected);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <h2 className="text-lg font-semibold">{t("payment.title")}</h2>
      <div className="flex flex-col gap-2">
        {METHODS.map((m) => {
          const active = selected === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setSelected(m)}
              aria-pressed={active}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              {t(PAYMENT_METHOD_KEY[m])}
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="border-input bg-background size-4 accent-primary"
        />
        {t("checkout.payment.confirm")}
      </label>
      <Button type="submit" disabled={!canSubmit} className="w-full">
        {t("checkout.continue")}
      </Button>
    </form>
  );
}
