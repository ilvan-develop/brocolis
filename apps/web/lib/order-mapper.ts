import type {
  DeliveryAddress,
  Money,
  Order,
  OrderTotals,
} from "@brocolis/contracts";
import { formatAddress } from "@brocolis/formatters";
import type { MessageKey } from "@brocolis/i18n";
import { orderStatusKey } from "./order-status";

export function formatDeliveryAddress(address: DeliveryAddress): string {
  return formatAddress(
    address.addressLine,
    address.city,
    address.zone,
    address.referencePoint,
  );
}

export type OrderSummary = {
  orderId: string;
  itemCount: number;
  total: Money;
  statusKey: MessageKey;
  deliveryAddress: string;
  createdAt: Date;
};

export function summarizeOrder(order: Order): OrderSummary {
  const itemCount = order.items.reduce(
    (count, item) => count + item.quantity,
    0,
  );
  return {
    orderId: order.id,
    itemCount,
    total: order.totals.total,
    statusKey: orderStatusKey(order.status),
    deliveryAddress:
      order.deliveryAddress !== undefined
        ? formatDeliveryAddress(order.deliveryAddress)
        : "",
    createdAt: order.createdAt,
  };
}

export type TotalsLineId =
  | "subtotal"
  | "deliveryFee"
  | "vat"
  | "discount"
  | "total";

export type TotalsLine = {
  id: TotalsLineId;
  amount: Money;
};

export const TOTALS_LINE_KEY: Record<TotalsLineId, MessageKey> = {
  subtotal: "cart.subtotal",
  deliveryFee: "delivery.fee",
  vat: "order.vat",
  discount: "order.discount",
  total: "order.total",
};

export function totalsToLines(totals: OrderTotals): TotalsLine[] {
  const lines: TotalsLine[] = [
    { id: "subtotal", amount: totals.subtotal },
    { id: "deliveryFee", amount: totals.deliveryFee },
    { id: "vat", amount: totals.vat },
  ];
  if (totals.discount !== undefined && totals.discount.amount > 0) {
    lines.push({ id: "discount", amount: totals.discount });
  }
  lines.push({ id: "total", amount: totals.total });
  return lines;
}

export function computeTotals(input: {
  subtotal: Money;
  deliveryFee: Money;
  vatRateMinor: number;
}): OrderTotals {
  const { subtotal, deliveryFee, vatRateMinor } = input;
  const vatAmount = Math.round((subtotal.amount * vatRateMinor) / 10000);
  const totalAmount = subtotal.amount + deliveryFee.amount + vatAmount;
  return {
    subtotal,
    deliveryFee,
    vat: { amount: vatAmount, currency: subtotal.currency },
    total: { amount: totalAmount, currency: subtotal.currency },
  };
}
