import type { PaymentStatus } from "@brocolis/contracts";
import type { MessageKey } from "@brocolis/i18n";
import type { BadgeVariant } from "./badge-variant";

export const PAYMENT_STATUS_KEY: Record<PaymentStatus, MessageKey> = {
  PENDING: "payment.status.pending",
  CONFIRMED: "payment.status.confirmed",
  FAILED: "payment.status.failed",
  REFUNDED: "payment.status.refunded",
};

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, BadgeVariant> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  FAILED: "destructive",
  REFUNDED: "outline",
};

export function paymentStatusKey(status: PaymentStatus): MessageKey {
  return PAYMENT_STATUS_KEY[status];
}

export function paymentStatusBadgeVariant(status: PaymentStatus): BadgeVariant {
  return PAYMENT_STATUS_BADGE[status];
}

export function isSettled(status: PaymentStatus): boolean {
  return status === "CONFIRMED" || status === "REFUNDED";
}
