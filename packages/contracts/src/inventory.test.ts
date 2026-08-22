import { describe, expect, it } from "vitest";
import {
  adjustStockInputSchema,
  batchSchema,
  inventoryAlertSchema,
  inventoryAlertThresholdsSchema,
  inventoryItemSchema,
  listInventoryInputSchema,
  receiveBatchInputSchema,
  stockMovementSchema,
  updateReorderPointInputSchema,
} from "./inventory.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";

describe("inventory schemas", () => {
  it("valida inventoryItem com stock e reorderPoint", () => {
    const item = inventoryItemSchema.parse({
      id: cuid,
      productId: cuid,
      pharmacyId: cuid,
      quantityOnHand: 40,
      reorderPoint: 10,
      organizationId: uuid,
      marketCode: "AO",
      updatedAt: new Date(),
    });
    expect(item.quantityOnHand).toBe(40);
    expect(item.reorderPoint).toBe(10);
    expect(item.batchId).toBeUndefined();
  });

  it("rejeita inventoryItem com stock negativo", () => {
    expect(() =>
      inventoryItemSchema.parse({
        id: cuid,
        productId: cuid,
        pharmacyId: cuid,
        quantityOnHand: -1,
        reorderPoint: 10,
        organizationId: uuid,
        marketCode: "AO",
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it("valida batch FIFO com datas e custo minor", () => {
    const batch = batchSchema.parse({
      id: cuid,
      productId: cuid,
      pharmacyId: cuid,
      batchNumber: "B-2026-01",
      expiryDate: new Date("2026-12-31"),
      receivedQty: 100,
      remainingQty: 80,
      costPriceMinor: 1200,
      organizationId: uuid,
      marketCode: "AO",
      createdAt: new Date(),
    });
    expect(batch.remainingQty).toBe(80);
    expect(batch.costPriceMinor).toBe(1200);
  });

  it("rejeita batch com remainingQty acima de receivedQty", () => {
    expect(() =>
      batchSchema.parse({
        id: cuid,
        productId: cuid,
        pharmacyId: cuid,
        batchNumber: "B-2026-01",
        expiryDate: new Date("2026-12-31"),
        receivedQty: 10,
        remainingQty: 11,
        costPriceMinor: 0,
        organizationId: uuid,
        marketCode: "AO",
        createdAt: new Date(),
      }),
    ).toThrow(/remainingQty/);
  });

  it("rejeita batch com custo negativo", () => {
    expect(() =>
      batchSchema.parse({
        id: cuid,
        productId: cuid,
        pharmacyId: cuid,
        batchNumber: "B-2026-01",
        expiryDate: new Date("2026-12-31"),
        receivedQty: 10,
        remainingQty: 10,
        costPriceMinor: -1,
        organizationId: uuid,
        marketCode: "AO",
        createdAt: new Date(),
      }),
    ).toThrow();
  });

  it("receiveBatchInput aceita receção futura", () => {
    const parsed = receiveBatchInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      productId: cuid,
      pharmacyId: cuid,
      batchNumber: "B-2026-02",
      expiryDate: new Date("2027-01-15"),
      receivedQty: 50,
      costPriceMinor: 800,
    });
    expect(parsed.receivedQty).toBe(50);
  });

  it("rejeita receiveBatchInput com quantidade zero", () => {
    expect(() =>
      receiveBatchInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        productId: cuid,
        pharmacyId: cuid,
        batchNumber: "B-2026-02",
        expiryDate: new Date("2027-01-15"),
        receivedQty: 0,
        costPriceMinor: 800,
      }),
    ).toThrow();
  });

  it("rejeita adjustment de stock com variação zero", () => {
    expect(() =>
      adjustStockInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        itemId: cuid,
        qty: 0,
      }),
    ).toThrow(/não pode ser zero/);
  });

  it("aceita adjustment negativo (saída)", () => {
    const parsed = adjustStockInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      itemId: cuid,
      qty: -5,
      reason: "quebrado",
    });
    expect(parsed.qty).toBe(-5);
    expect(parsed.reason).toBe("quebrado");
  });

  it("stockMovement rejeita qty zero mas aceita negativa", () => {
    expect(() =>
      stockMovementSchema.parse({
        id: cuid,
        itemId: cuid,
        type: "RECEIPT",
        qty: 0,
        organizationId: uuid,
        marketCode: "AO",
        createdAt: new Date(),
      }),
    ).toThrow();
    const parsed = stockMovementSchema.parse({
      id: cuid,
      itemId: cuid,
      type: "ADJUSTMENT",
      qty: -3,
      organizationId: uuid,
      marketCode: "AO",
      createdAt: new Date(),
    });
    expect(parsed.qty).toBe(-3);
  });

  it("stockMovement aceita todos os tipos FIFO", () => {
    for (const type of [
      "RECEIPT",
      "ADJUSTMENT",
      "DISPENSE",
      "REFUND",
      "RESERVATION",
      "RELEASE",
    ]) {
      const parsed = stockMovementSchema.parse({
        id: cuid,
        itemId: cuid,
        type,
        qty: 1,
        organizationId: uuid,
        marketCode: "AO",
        createdAt: new Date(),
      });
      expect(parsed.type).toBe(type);
    }
  });

  it("inventoryAlert rejeita tipo desconhecido", () => {
    expect(() =>
      inventoryAlertSchema.parse({
        id: cuid,
        itemId: cuid,
        pharmacyId: cuid,
        type: "OVERSTOCKED",
        organizationId: uuid,
        marketCode: "AO",
        createdAt: new Date(),
      }),
    ).toThrow();
  });

  it("thresholds usam defaults LOW/EQUAL e 90 dias expiring", () => {
    const thresholds = inventoryAlertThresholdsSchema.parse({});
    expect(thresholds.low).toBe(0);
    expect(thresholds.critical).toBe(0);
    expect(thresholds.expiringDays).toBe(90);
  });

  it("listInventory aplica default de limit 20", () => {
    const parsed = listInventoryInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
    });
    expect(parsed.limit).toBe(20);
  });

  it("updateReorderPoint rejeita ponto negativo", () => {
    expect(() =>
      updateReorderPointInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        itemId: cuid,
        reorderPoint: -1,
      }),
    ).toThrow();
  });
});
