import type { DeliveryStatus, Money } from "@brocolis/contracts";
import type { MessageKey } from "@brocolis/i18n";
import type { BadgeVariant } from "./badge-variant";
import { mockCuid, PHARMACY_CURRENCY } from "./pharmacy-data";

export type PharmacyDeliveryStatus = DeliveryStatus;

export type PharmacyDelivery = {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  zone: string;
  addressLine: string;
  city: string;
  fee: Money;
  etaMinutes: number;
  status: PharmacyDeliveryStatus;
  driverName: string | null;
};

export const DELIVERY_STATUS_KEY: Record<PharmacyDeliveryStatus, MessageKey> = {
  SCHEDULED: "pharmacy.delivery.scheduled",
  ASSIGNED: "pharmacy.delivery.assigned",
  IN_PROGRESS: "pharmacy.delivery.inProgress",
  COMPLETED: "pharmacy.delivery.completed",
  CANCELED: "pharmacy.delivery.canceled",
};

export function deliveryStatusBadgeVariant(
  status: PharmacyDeliveryStatus,
): BadgeVariant {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "IN_PROGRESS":
    case "SCHEDULED":
      return "secondary";
    case "ASSIGNED":
      return "outline";
    case "CANCELED":
      return "destructive";
  }
}

export function deliveryEtaLabel(etaMinutes: number): string {
  if (etaMinutes < 60) {
    return `${etaMinutes} min`;
  }
  const hours = Math.floor(etaMinutes / 60);
  const minutes = etaMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

function delivery(
  index: number,
  orderNumber: string,
  customerName: string,
  zone: string,
  status: PharmacyDeliveryStatus,
  etaMinutes: number,
  driverName: string | null,
): PharmacyDelivery {
  return {
    id: mockCuid(`dly-${index}`),
    orderId: mockCuid(`ord-${index + 100}`),
    orderNumber,
    customerName,
    zone,
    addressLine: `Rua da Samba ${index + 10}`,
    city: "Luanda",
    fee: { amount: 1500, currency: PHARMACY_CURRENCY },
    etaMinutes,
    status,
    driverName,
  };
}

export const DEMO_PHARMACY_DELIVERIES: readonly PharmacyDelivery[] = [
  delivery(1, "ANG-1108", "João Manuel", "urb", "SCHEDULED", 45, null),
  delivery(
    2,
    "ANG-1107",
    "Ana Domingos",
    "sub",
    "ASSIGNED",
    75,
    "Nelson Bumba",
  ),
  delivery(
    3,
    "ANG-1106",
    "Marta Sousa",
    "urb",
    "IN_PROGRESS",
    30,
    "Paulo Kiala",
  ),
  delivery(
    4,
    "ANG-1103",
    "Carlos Chicapa",
    "urb",
    "IN_PROGRESS",
    20,
    "Nelson Bumba",
  ),
  delivery(
    5,
    "ANG-1102",
    "Teresa Cardoso",
    "sub",
    "COMPLETED",
    0,
    "Paulo Kiala",
  ),
  delivery(6, "ANG-1101", "Rui Mateus", "urb", "CANCELED", 0, null),
];
