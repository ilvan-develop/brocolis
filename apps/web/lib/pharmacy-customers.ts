import type { MessageKey } from "@brocolis/i18n";
import { normalizeText } from "./catalog";
import { daysFromNow, mockCuid } from "./pharmacy-data";

export type PharmacyCustomer = {
  id: string;
  name: string;
  phoneNational: string;
  orderCount: number;
  totalSpentMinor: number;
  lastOrderAt: Date | null;
  firstOrderAt: Date | null;
};

export function formatCustomerPhone(phoneNational: string): string {
  return `+244 ${phoneNational}`;
}

export type CustomerSegment = "new" | "recurring";

export const CUSTOMER_SEGMENT_KEY: Record<CustomerSegment, MessageKey> = {
  new: "pharmacy.customers.new",
  recurring: "pharmacy.customers.recurring",
};

export function customerSegment(customer: PharmacyCustomer): CustomerSegment {
  return customer.orderCount >= 2 ? "recurring" : "new";
}

export function filterPharmacyCustomers(
  customers: readonly PharmacyCustomer[],
  query: string,
): PharmacyCustomer[] {
  const normalized = normalizeText(query);
  if (normalized.length === 0) {
    return [...customers];
  }
  return customers.filter(
    (customer) =>
      normalizeText(customer.name).includes(normalized) ||
      normalizeText(customer.phoneNational).includes(normalized),
  );
}

export function sortCustomersByRecent(
  customers: readonly PharmacyCustomer[],
): PharmacyCustomer[] {
  return [...customers].sort((a, b) => {
    const aTime = a.lastOrderAt?.getTime() ?? 0;
    const bTime = b.lastOrderAt?.getTime() ?? 0;
    return bTime - aTime;
  });
}

function customer(
  index: number,
  name: string,
  phoneNational: string,
  orderCount: number,
  totalSpentMinor: number,
  lastOrderDaysAgo: number | null,
  firstOrderDaysAgo: number,
): PharmacyCustomer {
  return {
    id: mockCuid(`cus-${index}`),
    name,
    phoneNational,
    orderCount,
    totalSpentMinor,
    lastOrderAt:
      lastOrderDaysAgo === null ? null : daysFromNow(-lastOrderDaysAgo),
    firstOrderAt: daysFromNow(-firstOrderDaysAgo),
  };
}

export const DEMO_PHARMACY_CUSTOMERS: readonly PharmacyCustomer[] = [
  customer(1, "João Manuel", "923000111", 3, 45600, 1, 40),
  customer(2, "Ana Domingos", "924555222", 1, 6950, 0, 1),
  customer(3, "Marta Sousa", "925111333", 2, 23800, 1, 20),
  customer(4, "Pedro Paulo", "932722444", 4, 81200, 1, 90),
  customer(5, "Luísa Mendes", "933900555", 1, 5300, 2, 2),
  customer(6, "Carlos Chicapa", "921333666", 5, 124500, 0, 120),
  customer(7, "Rui Mateus", "944210777", 1, 6200, 8, 8),
];
