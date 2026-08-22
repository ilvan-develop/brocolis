"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Minus, Plus } from "lucide-react";
import { clampQuantity } from "@/lib/cart";

type QuantityControlProps = {
  quantity: number;
  max?: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

export function QuantityControl({
  quantity,
  max,
  onDecrease,
  onIncrease,
}: QuantityControlProps) {
  const current = clampQuantity(quantity, max);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onDecrease}
        disabled={current <= 1}
        aria-label={t("cart.quantity")}
      >
        <Minus />
      </Button>
      <span
        className="min-w-8 text-center text-sm font-medium"
        aria-live="polite"
      >
        {current}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onIncrease}
        disabled={max !== undefined && current >= max}
        aria-label={t("cart.quantity")}
      >
        <Plus />
      </Button>
    </div>
  );
}
