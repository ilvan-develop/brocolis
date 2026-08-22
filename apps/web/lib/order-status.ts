import type { OrderStatus } from "@brocolis/contracts";
import type { MessageKey } from "@brocolis/i18n";
import type { BadgeVariant } from "./badge-variant";

export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELED",
];

export const ORDER_STATUS_KEY: Record<OrderStatus, MessageKey> = {
  PENDING: "order.status.pending",
  CONFIRMED: "order.status.confirmed",
  PROCESSING: "order.status.preparing",
  IN_TRANSIT: "order.status.in_transit",
  DELIVERED: "order.status.delivered",
  CANCELED: "order.status.canceled",
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, BadgeVariant> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PROCESSING: "secondary",
  IN_TRANSIT: "default",
  DELIVERED: "outline",
  CANCELED: "destructive",
};

export function orderStatusKey(status: OrderStatus): MessageKey {
  return ORDER_STATUS_KEY[status];
}

export function orderStatusBadgeVariant(status: OrderStatus): BadgeVariant {
  return ORDER_STATUS_BADGE[status];
}

const PROGRESSION: readonly OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "IN_TRANSIT",
  "DELIVERED",
];

function progressIndex(status: OrderStatus): number {
  const index = PROGRESSION.indexOf(status);
  return index === -1 ? PROGRESSION.length : index;
}

export function isTerminal(status: OrderStatus): boolean {
  return status === "DELIVERED" || status === "CANCELED";
}

export function isCanceled(status: OrderStatus): boolean {
  return status === "CANCELED";
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) {
    return false;
  }
  if (from === "CANCELED" || to === "CANCELED") {
    return false;
  }
  return progressIndex(to) > progressIndex(from);
}
