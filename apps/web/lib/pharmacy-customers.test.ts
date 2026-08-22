import { describe, expect, it } from "vitest";
import {
  CUSTOMER_SEGMENT_KEY,
  customerSegment,
  DEMO_PHARMACY_CUSTOMERS,
  filterPharmacyCustomers,
  formatCustomerPhone,
  sortCustomersByRecent,
} from "./pharmacy-customers";

describe("pharmacy-customers — segmento", () => {
  it("novo < 2 pedidos, recorrente >= 2", () => {
    expect(
      customerSegment({ ...DEMO_PHARMACY_CUSTOMERS[0]!, orderCount: 1 }),
    ).toBe("new");
    expect(
      customerSegment({ ...DEMO_PHARMACY_CUSTOMERS[0]!, orderCount: 2 }),
    ).toBe("recurring");
  });
});

describe("pharmacy-customers — filtro e ordenação", () => {
  it("filtra por nome e telefone, ignorando acentos e caixa", () => {
    expect(
      filterPharmacyCustomers(DEMO_PHARMACY_CUSTOMERS, "joão"),
    ).toHaveLength(1);
    expect(
      filterPharmacyCustomers(DEMO_PHARMACY_CUSTOMERS, "923000111"),
    ).toHaveLength(1);
    expect(
      filterPharmacyCustomers(DEMO_PHARMACY_CUSTOMERS, "   "),
    ).toHaveLength(DEMO_PHARMACY_CUSTOMERS.length);
  });

  it("ordena por última compra, nulos no fim", () => {
    const withFresh = [
      ...DEMO_PHARMACY_CUSTOMERS,
      { ...DEMO_PHARMACY_CUSTOMERS[0]!, lastOrderAt: null },
    ];
    const sorted = sortCustomersByRecent(withFresh);
    expect(sorted.at(-1)?.lastOrderAt).toBeNull();
    expect(sorted[0]?.lastOrderAt).not.toBeNull();
  });
});

describe("pharmacy-customers — utilidades", () => {
  it("formata telefone nacional", () => {
    expect(formatCustomerPhone("923000111")).toBe("+244 923000111");
  });

  it("CUSTOMER_SEGMENT_KEY cobre os dois segmentos", () => {
    expect(Object.keys(CUSTOMER_SEGMENT_KEY).sort()).toEqual([
      "new",
      "recurring",
    ]);
  });
});
