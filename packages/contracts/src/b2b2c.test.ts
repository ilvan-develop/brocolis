import { describe, expect, it } from "vitest";
import {
  b2b2cFlowStageSchema,
  b2b2cFlowStatusSchema,
  b2b2cOrderSchema,
  b2b2cPartyTypeSchema,
  b2b2cStockSourceSchema,
  b2b2cTimelineEntrySchema,
  confirmPharmacyInputSchema,
  createB2b2cOrderInputSchema,
  getB2b2cOrderInputSchema,
  getB2b2cTimelineInputSchema,
  listB2b2cOrdersInputSchema,
  markDeliveredInputSchema,
  pullFromSupplierInputSchema,
} from "./b2b2c.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";

const money = { amount: 5000, currency: "AOA" };

describe("B2B2C schemas — flow enums", () => {
  it("stage enum contains 4 stages", () => {
    expect(b2b2cFlowStageSchema.options).toEqual([
      "CONSUMER_ORDER",
      "PHARMACY_CONFIRMATION",
      "SUPPLIER_PULL",
      "DELIVERY",
    ]);
  });

  it("status enum contains 4 statuses", () => {
    expect(b2b2cFlowStatusSchema.options).toEqual([
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "DELAYED",
    ]);
  });

  it("party type enum contains 3 types", () => {
    expect(b2b2cPartyTypeSchema.options).toEqual([
      "PHARMACY",
      "SUPPLIER",
      "PLATFORM",
    ]);
  });

  it("stock source enum contains 2 sources", () => {
    expect(b2b2cStockSourceSchema.options).toEqual([
      "PHARMACY_STOCK",
      "SUPPLIER_PULL",
    ]);
  });
});

describe("B2B2C schemas — createB2b2cOrderInput", () => {
  it("validates minimal order", () => {
    const parsed = createB2b2cOrderInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      pharmacyId: cuid,
      items: [{ productId: cuid, quantity: 2, unitPrice: money }],
      total: money,
    });
    expect(parsed.items).toHaveLength(1);
    expect(parsed.pharmacyId).toBe(cuid);
  });

  it("rejects order without items", () => {
    expect(() =>
      createB2b2cOrderInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        pharmacyId: cuid,
        items: [],
        total: money,
      }),
    ).toThrow();
  });

  it("rejects order with invalid marketCode", () => {
    expect(() =>
      createB2b2cOrderInputSchema.parse({
        organizationId: uuid,
        marketCode: "invalid",
        pharmacyId: cuid,
        items: [{ productId: cuid, quantity: 1, unitPrice: money }],
        total: money,
      }),
    ).toThrow();
  });
});

describe("B2B2C schemas — b2b2cOrder", () => {
  it("validates full order", () => {
    const order = b2b2cOrderSchema.parse({
      id: cuid,
      organizationId: uuid,
      marketCode: "AO",
      pharmacyId: cuid,
      currentStage: "CONSUMER_ORDER",
      currentStatus: "PENDING",
      items: [{ productId: cuid, quantity: 1, unitPrice: money }],
      total: money,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(order.currentStage).toBe("CONSUMER_ORDER");
    expect(order.stockSource).toBe("PHARMACY_STOCK");
  });

  it("accepts optional supplierId", () => {
    const order = b2b2cOrderSchema.parse({
      id: cuid,
      organizationId: uuid,
      marketCode: "AO",
      pharmacyId: cuid,
      supplierId: cuid,
      currentStage: "SUPPLIER_PULL",
      currentStatus: "IN_PROGRESS",
      stockSource: "SUPPLIER_PULL",
      items: [{ productId: cuid, quantity: 3, unitPrice: money }],
      total: money,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(order.supplierId).toBe(cuid);
    expect(order.stockSource).toBe("SUPPLIER_PULL");
  });
});

describe("B2B2C schemas — b2b2cTimelineEntry", () => {
  it("validates timeline entry", () => {
    const entry = b2b2cTimelineEntrySchema.parse({
      id: cuid,
      orderId: cuid,
      stage: "PHARMACY_CONFIRMATION",
      status: "COMPLETED",
      responsibleParty: "PHARMACY",
      responsibleId: "pharm-001",
      note: "Confirmed",
      createdAt: new Date(),
    });
    expect(entry.stage).toBe("PHARMACY_CONFIRMATION");
    expect(entry.responsibleParty).toBe("PHARMACY");
  });

  it("accepts optional slaDeadline and stockSource", () => {
    const entry = b2b2cTimelineEntrySchema.parse({
      id: cuid,
      orderId: cuid,
      stage: "SUPPLIER_PULL",
      status: "IN_PROGRESS",
      responsibleParty: "SUPPLIER",
      responsibleId: "sup-001",
      stockSource: "SUPPLIER_PULL",
      slaDeadline: new Date(),
      createdAt: new Date(),
    });
    expect(entry.stockSource).toBe("SUPPLIER_PULL");
  });
});

describe("B2B2C schemas — input queries", () => {
  it("getB2b2cOrderInput validates", () => {
    const parsed = getB2b2cOrderInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      orderId: cuid,
    });
    expect(parsed.orderId).toBe(cuid);
  });

  it("listB2b2cOrdersInput with defaults", () => {
    const parsed = listB2b2cOrdersInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
    });
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it("confirmPharmacyInput validates", () => {
    const parsed = confirmPharmacyInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      orderId: cuid,
      pharmacyId: cuid,
    });
    expect(parsed.orderId).toBe(cuid);
  });

  it("pullFromSupplierInput validates", () => {
    const parsed = pullFromSupplierInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      orderId: cuid,
      supplierId: cuid,
    });
    expect(parsed.supplierId).toBe(cuid);
  });

  it("markDeliveredInput validates", () => {
    const parsed = markDeliveredInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      orderId: cuid,
    });
    expect(parsed.orderId).toBe(cuid);
  });

  it("getB2b2cTimelineInput validates", () => {
    const parsed = getB2b2cTimelineInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      orderId: cuid,
    });
    expect(parsed.orderId).toBe(cuid);
  });
});
