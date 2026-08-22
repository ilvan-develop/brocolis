import type {
  Money,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrescriptionStatus,
} from "@brocolis/contracts";
import type { MessageKey } from "@brocolis/i18n";
import { normalizeText } from "./catalog";
import {
  daysFromNow,
  mockCuid,
  PHARMACY_CURRENCY,
  PHARMACY_ID,
  PHARMACY_MARKET,
  PHARMACY_ORG_ID,
} from "./pharmacy-data";

export type PharmacyOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
};

export type PharmacyOrderDelivery = {
  zone: string;
  addressLine: string;
  city: string;
  referencePoint: string | null;
  fee: Money;
  etaMinutes: number;
};

export type PharmacyOrder = {
  id: string;
  number: string;
  customerName: string;
  customerPhoneNational: string;
  createdAt: Date;
  updatedAt: Date;
  status: OrderStatus;
  ready: boolean;
  items: PharmacyOrderItem[];
  totals: {
    subtotal: Money;
    deliveryFee: Money;
    total: Money;
    currency: string;
  };
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  prescription: {
    required: boolean;
    status: PrescriptionStatus | null;
  };
  delivery: PharmacyOrderDelivery;
  organizationId: string;
  marketCode: string;
  pharmacyId: string;
};

export const PAYMENT_METHOD_KEY: Record<PaymentMethod, MessageKey> = {
  CARD: "payment.method.card",
  WALLET: "payment.method.wallet",
  REFERENCE: "payment.method.reference",
  COD: "payment.method.cod",
  MOBILE: "payment.method.mobile",
};

export function orderPrescriptionBadgeKey(
  prescription: PharmacyOrder["prescription"],
): MessageKey {
  if (!prescription.required || prescription.status === null) {
    return "pharmacy.orders.prescription.notRequired";
  }
  switch (prescription.status) {
    case "APPROVED":
      return "pharmacy.orders.prescription.approved";
    case "REJECTED":
    case "EXPIRED":
      return "pharmacy.orders.prescription.rejected";
    case "PENDING":
    case "RESPONSE_REQUIRED":
      return "pharmacy.orders.prescription.pending";
  }
}

const DELIVERY_ZONE_KEY: Record<string, MessageKey> = {
  urb: "delivery.zone.urban",
  sub: "delivery.zone.suburban",
};

export function deliveryZoneLabelKey(zone: string): MessageKey {
  return DELIVERY_ZONE_KEY[zone] ?? "delivery.zone.urban";
}

export type PharmacyOrderTab =
  | "all"
  | "new"
  | "confirmed"
  | "preparing"
  | "ready"
  | "in_transit"
  | "delivered"
  | "canceled";

export const PHARMACY_ORDER_TABS: readonly {
  id: PharmacyOrderTab;
  key: MessageKey;
  statuses: readonly OrderStatus[];
  requiresReady?: boolean;
}[] = [
  { id: "all", key: "pharmacy.orders.tab.all", statuses: [] },
  { id: "new", key: "pharmacy.orders.tab.new", statuses: ["PENDING"] },
  {
    id: "confirmed",
    key: "pharmacy.orders.tab.confirmed",
    statuses: ["CONFIRMED"],
  },
  {
    id: "preparing",
    key: "pharmacy.orders.tab.preparing",
    statuses: ["PROCESSING"],
    requiresReady: false,
  },
  {
    id: "ready",
    key: "pharmacy.orders.tab.ready",
    statuses: ["PROCESSING"],
    requiresReady: true,
  },
  {
    id: "in_transit",
    key: "pharmacy.orders.tab.inTransit",
    statuses: ["IN_TRANSIT"],
  },
  {
    id: "delivered",
    key: "pharmacy.orders.tab.delivered",
    statuses: ["DELIVERED"],
  },
  {
    id: "canceled",
    key: "pharmacy.orders.tab.canceled",
    statuses: ["CANCELED"],
  },
];

export function filterOrdersByTab(
  orders: readonly PharmacyOrder[],
  tab: PharmacyOrderTab,
): PharmacyOrder[] {
  if (tab === "all") {
    return [...orders];
  }
  const config = PHARMACY_ORDER_TABS.find((item) => item.id === tab);
  if (config === undefined) {
    return [];
  }
  return orders.filter(
    (order) =>
      config.statuses.includes(order.status) &&
      (config.requiresReady === undefined ||
        order.ready === config.requiresReady),
  );
}

export function filterOrdersByQuery(
  orders: readonly PharmacyOrder[],
  query: string,
): PharmacyOrder[] {
  const normalized = normalizeText(query);
  if (normalized.length === 0) {
    return [...orders];
  }
  return orders.filter(
    (order) =>
      normalizeText(order.number).includes(normalized) ||
      normalizeText(order.customerName).includes(normalized),
  );
}

export type OrderAction =
  | { step: "confirm" }
  | { step: "prepare" }
  | { step: "ready" }
  | { step: "ship" }
  | { step: "deliver" };

export const ORDER_ACTION_KEY: Record<OrderAction["step"], MessageKey> = {
  confirm: "pharmacy.orders.workspace.confirm",
  prepare: "pharmacy.orders.workspace.startProcessing",
  ready: "pharmacy.orders.workspace.markReady",
  ship: "pharmacy.orders.workspace.ship",
  deliver: "pharmacy.orders.workspace.deliver",
};

export function nextOrderAction(
  order: Pick<PharmacyOrder, "status" | "ready">,
): OrderAction | null {
  switch (order.status) {
    case "PENDING":
      return { step: "confirm" };
    case "CONFIRMED":
      return { step: "prepare" };
    case "PROCESSING":
      return order.ready ? { step: "ship" } : { step: "ready" };
    case "IN_TRANSIT":
      return { step: "deliver" };
    case "DELIVERED":
    case "CANCELED":
      return null;
  }
}

export function canProsseguir(
  order: Pick<PharmacyOrder, "status" | "ready">,
): boolean {
  return nextOrderAction(order) !== null;
}

export function advanceOrder(order: PharmacyOrder): PharmacyOrder {
  const action = nextOrderAction(order);
  if (action === null) {
    return order;
  }

  let status = order.status;
  let ready = order.ready;
  let updatedAt = order.updatedAt;

  switch (action.step) {
    case "confirm":
      status = "CONFIRMED";
      break;
    case "prepare":
      status = "PROCESSING";
      break;
    case "ready":
      ready = true;
      break;
    case "ship":
      status = "IN_TRANSIT";
      ready = false;
      break;
    case "deliver":
      status = "DELIVERED";
      break;
  }
  updatedAt = new Date();

  return { ...order, status, ready, updatedAt };
}

export function orderedCounts(orders: readonly PharmacyOrder[]): {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  inTransit: number;
  delivered: number;
  canceled: number;
} {
  const counts = {
    total: orders.length,
    pending: 0,
    confirmed: 0,
    processing: 0,
    inTransit: 0,
    delivered: 0,
    canceled: 0,
  };
  for (const order of orders) {
    switch (order.status) {
      case "PENDING":
        counts.pending += 1;
        break;
      case "CONFIRMED":
        counts.confirmed += 1;
        break;
      case "PROCESSING":
        counts.processing += 1;
        break;
      case "IN_TRANSIT":
        counts.inTransit += 1;
        break;
      case "DELIVERED":
        counts.delivered += 1;
        break;
      case "CANCELED":
        counts.canceled += 1;
        break;
    }
  }
  return counts;
}

export function salesTotal(
  orders: readonly PharmacyOrder[],
): { amount: number; currency: string } | null {
  let amount = 0;
  const currency =
    orders.length > 0
      ? (orders[0]?.totals.total.currency ?? PHARMACY_CURRENCY)
      : PHARMACY_CURRENCY;
  for (const order of orders) {
    if (order.status === "CANCELED") {
      continue;
    }
    amount += order.totals.total.amount;
  }
  if (orders.length === 0) {
    return null;
  }
  return { amount, currency };
}

function order(
  index: number,
  number: string,
  daysAgo: number,
  customerName: string,
  status: OrderStatus,
  ready: boolean,
  itemCount: number,
  totalAmount: number,
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  prescriptionRequired: boolean,
): PharmacyOrder {
  const unit = Math.round(totalAmount / itemCount);
  const created = daysFromNow(-daysAgo);
  return {
    id: mockCuid(`ord-${index}`),
    number,
    customerName,
    customerPhoneNational: `923 ${String(100000 + index * 1111).slice(0, 3)}`,
    createdAt: created,
    updatedAt: daysFromNow(-Math.max(daysAgo - 1, 0)),
    status,
    ready,
    items: Array.from({ length: itemCount }, (_, itemIndex) => {
      const productName =
        PRODUCT_NAMES[itemIndex % PRODUCT_NAMES.length] ?? "Medicamento";
      const lineTotal = { amount: unit, currency: PHARMACY_CURRENCY };
      return {
        productId: mockCuid(`pro-${itemIndex + 1}`),
        productName,
        quantity: 1,
        unitPrice: lineTotal,
        lineTotal,
      };
    }),
    totals: {
      subtotal: { amount: totalAmount, currency: PHARMACY_CURRENCY },
      deliveryFee: { amount: 1500, currency: PHARMACY_CURRENCY },
      total: { amount: totalAmount + 1500, currency: PHARMACY_CURRENCY },
      currency: PHARMACY_CURRENCY,
    },
    paymentMethod,
    paymentStatus,
    prescription: {
      required: prescriptionRequired,
      status: prescriptionRequired ? "APPROVED" : null,
    },
    delivery: {
      zone: zones[index % zones.length] ?? "urb",
      addressLine: `${streets[index % streets.length] ?? "Rua"} ${index + 1}`,
      city: "Luanda",
      referencePoint: "Perto do restaurante",
      fee: { amount: 1500, currency: PHARMACY_CURRENCY },
      etaMinutes: 45 + index * 15,
    },
    organizationId: PHARMACY_ORG_ID,
    marketCode: PHARMACY_MARKET,
    pharmacyId: PHARMACY_ID,
  };
}

const PRODUCT_NAMES = [
  "Amoxicilina 500mg",
  "Paracetamol 1000mg",
  "Ibuprofeno 400mg",
  "Vitamina C 500mg",
  "Soro oral 500ml",
];

const zones = ["urb", "sub", "urb", "urb", "sub", "urb", "sub", "urb"] as const;

const streets = [
  "Rua da Samba",
  "Av. 21 de Janeiro",
  "Rua da Missão",
  "Av. Deolinda Rodrigues",
] as const;

export const DEMO_PHARMACY_ORDERS: readonly PharmacyOrder[] = [
  order(
    1,
    "ANG-1108",
    0,
    "João Manuel",
    "PENDING",
    false,
    2,
    12450,
    "REFERENCE",
    "PENDING",
    true,
  ),
  order(
    2,
    "ANG-1107",
    0,
    "Ana Domingos",
    "PENDING",
    false,
    1,
    5450,
    "COD",
    "PENDING",
    false,
  ),
  order(
    3,
    "ANG-1106",
    1,
    "Marta Sousa",
    "CONFIRMED",
    false,
    3,
    18700,
    "CARD",
    "CONFIRMED",
    true,
  ),
  order(
    4,
    "ANG-1105",
    1,
    "Pedro Paulo",
    "PROCESSING",
    false,
    2,
    9600,
    "REFERENCE",
    "CONFIRMED",
    true,
  ),
  order(
    5,
    "ANG-1104",
    2,
    "Luísa Mendes",
    "PROCESSING",
    true,
    1,
    3500,
    "MOBILE",
    "CONFIRMED",
    false,
  ),
  order(
    6,
    "ANG-1103",
    2,
    "Carlos Chicapa",
    "IN_TRANSIT",
    false,
    4,
    21400,
    "CARD",
    "CONFIRMED",
    true,
  ),
  order(
    7,
    "ANG-1102",
    4,
    "Teresa Cardoso",
    "DELIVERED",
    false,
    2,
    8800,
    "REFERENCE",
    "CONFIRMED",
    true,
  ),
  order(
    8,
    "ANG-1101",
    6,
    "Rui Mateus",
    "CANCELED",
    false,
    1,
    6200,
    "COD",
    "FAILED",
    false,
  ),
];
