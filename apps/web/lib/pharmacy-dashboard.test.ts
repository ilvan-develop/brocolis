import { describe, expect, it } from "vitest";
import { derivePharmacyKpis } from "./pharmacy-dashboard";
import { DEMO_PHARMACY_SETTLEMENTS } from "./pharmacy-finance";
import { DEMO_PHARMACY_INVENTORY } from "./pharmacy-inventory";
import { DEMO_PHARMACY_ORDERS } from "./pharmacy-orders";

describe("pharmacy-dashboard — KPIs", () => {
  it("deriva KPIs dos fixtures", () => {
    const kpis = derivePharmacyKpis(
      DEMO_PHARMACY_ORDERS,
      DEMO_PHARMACY_INVENTORY,
      DEMO_PHARMACY_SETTLEMENTS,
    );
    expect(kpis.orderCount).toBe(DEMO_PHARMACY_ORDERS.length);
    expect(kpis.salesCurrency).toBe("AOA");
    expect(kpis.salesMinor).toBeGreaterThan(0);
    expect(kpis.stockPct).toBeGreaterThan(0);
    expect(kpis.stockPct).toBeLessThanOrEqual(100);
    expect(kpis.pendingSettlements).toBeGreaterThan(0);
    expect(kpis.pendingSettlementsMinor).toBeGreaterThan(0);
  });

  it("sem dados devolve zeros", () => {
    const kpis = derivePharmacyKpis([], [], []);
    expect(kpis.orderCount).toBe(0);
    expect(kpis.salesMinor).toBe(0);
    expect(kpis.salesCurrency).toBe("AOA");
    expect(kpis.stockPct).toBe(0);
    expect(kpis.pendingSettlements).toBe(0);
    expect(kpis.pendingSettlementsMinor).toBe(0);
  });
});
