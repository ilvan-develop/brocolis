import { describe, expect, it } from "vitest";
import {
  calculatedPriceSchema,
  calculatePriceInputSchema,
  checkCreditInputSchema,
  createCreditAccountInputSchema,
  creditCheckResultSchema,
  priceTierInputSchema,
  volumePriceInputSchema,
} from "./pricing.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";
const cuid2 = "c000000000000000000000002";

describe("pricing schemas", () => {
  it("validates priceTierInput", () => {
    const parsed = priceTierInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      supplierId: cuid,
      productId: cuid2,
      minQty: 10,
      unitPriceMinor: 4500,
    });
    expect(parsed.minQty).toBe(10);
  });

  it("rejects priceTierInput with minQty 0", () => {
    expect(() =>
      priceTierInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        supplierId: cuid,
        productId: cuid2,
        minQty: 0,
        unitPriceMinor: 4500,
      }),
    ).toThrow();
  });

  it("validates volumePriceInput", () => {
    const parsed = volumePriceInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      supplierId: cuid,
      productId: cuid2,
      minVolume: 100,
      discountBps: 500,
    });
    expect(parsed.discountBps).toBe(500);
  });

  it("rejects volumePriceInput with discountBps > 10000", () => {
    expect(() =>
      volumePriceInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        supplierId: cuid,
        productId: cuid2,
        minVolume: 100,
        discountBps: 10001,
      }),
    ).toThrow();
  });

  it("validates calculatePriceInput", () => {
    const parsed = calculatePriceInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      supplierId: cuid,
      productId: cuid2,
      quantity: 50,
    });
    expect(parsed.quantity).toBe(50);
  });

  it("validates calculatedPriceSchema", () => {
    const parsed = calculatedPriceSchema.parse({
      unitPriceMinor: 5000,
      lineTotalMinor: 250000,
      currency: "AOA",
    });
    expect(parsed.lineTotalMinor).toBe(250000);
  });

  it("validates calculatedPriceSchema with optional discount", () => {
    const parsed = calculatedPriceSchema.parse({
      unitPriceMinor: 5000,
      tierApplied: "bulk-100",
      volumeDiscountBps: 500,
      lineTotalMinor: 237500,
      currency: "AOA",
    });
    expect(parsed.tierApplied).toBe("bulk-100");
    expect(parsed.volumeDiscountBps).toBe(500);
  });

  it("validates createCreditAccountInput", () => {
    const parsed = createCreditAccountInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      supplierId: cuid,
      creditLimitMinor: 1000000,
    });
    expect(parsed.creditLimitMinor).toBe(1000000);
  });

  it("validates checkCreditInput", () => {
    const parsed = checkCreditInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      supplierId: cuid,
      amountMinor: 50000,
    });
    expect(parsed.amountMinor).toBe(50000);
  });

  it("rejects checkCreditInput with zero amount", () => {
    expect(() =>
      checkCreditInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        supplierId: cuid,
        amountMinor: 0,
      }),
    ).toThrow();
  });

  it("validates creditCheckResultSchema", () => {
    const parsed = creditCheckResultSchema.parse({
      available: true,
      creditLimitMinor: 1000000,
      balanceMinor: 500000,
      requestedMinor: 200000,
    });
    expect(parsed.available).toBe(true);
  });
});
