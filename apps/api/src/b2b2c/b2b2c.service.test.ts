import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { B2b2cService } from "./b2b2c.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const ORG_OTHER = "00000000-0000-4000-8000-000000000001";
const PHARMACY = "c000000000000000000000001";
const SUPPLIER = "c000000000000000000000002";
const PRODUCT = "c000000000000000000000003";
const MONEY = { amount: 5000, currency: "AOA" };

const baseOrder = {
  organizationId: ORG,
  marketCode: "AO",
  pharmacyId: PHARMACY,
  items: [{ productId: PRODUCT, quantity: 2, unitPrice: MONEY }],
  total: MONEY,
};

describe("B2b2cService — create order", () => {
  it("creates order with CONSUMER_ORDER stage", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    expect(order.id).toMatch(/^c/);
    expect(order.currentStage).toBe("CONSUMER_ORDER");
    expect(order.currentStatus).toBe("IN_PROGRESS");
    expect(order.stockSource).toBe("PHARMACY_STOCK");
    expect(order.items).toHaveLength(1);
  });

  it("creates timeline entry for consumer order", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    const tl = svc.getTimeline({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(tl).toHaveLength(1);
    expect(tl[0]?.stage).toBe("CONSUMER_ORDER");
    expect(tl[0]?.responsibleParty).toBe("PHARMACY");
  });
});

describe("B2b2cService — getOrder / listOrders", () => {
  it("getOrder returns order within scope", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    const found = svc.getOrder({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(found.id).toBe(order.id);
  });

  it("getOrder throws for wrong tenant", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    expect(() =>
      svc.getOrder({
        organizationId: ORG_OTHER,
        marketCode: "AO",
        orderId: order.id,
      }),
    ).toThrow(NotFoundException);
  });

  it("listOrders filters by pharmacyId", () => {
    const svc = new B2b2cService();
    svc.createOrder(baseOrder);
    svc.createOrder({ ...baseOrder, pharmacyId: SUPPLIER });
    const list = svc.listOrders({
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PHARMACY,
    });
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.pharmacyId).toBe(PHARMACY);
  });

  it("listOrders filters by stage", () => {
    const svc = new B2b2cService();
    svc.createOrder(baseOrder);
    const list = svc.listOrders({
      organizationId: ORG,
      marketCode: "AO",
      stage: "PHARMACY_CONFIRMATION",
    });
    expect(list.items).toHaveLength(0);
  });

  it("listOrders paginates", () => {
    const svc = new B2b2cService();
    for (let i = 0; i < 5; i++) {
      svc.createOrder(baseOrder);
    }
    const page1 = svc.listOrders({
      organizationId: ORG,
      marketCode: "AO",
      page: 1,
      pageSize: 2,
    });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(2);
  });
});

describe("B2b2cService — confirmPharmacy", () => {
  it("transitions from CONSUMER_ORDER to PHARMACY_CONFIRMATION", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    const confirmed = svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      pharmacyId: PHARMACY,
      note: "Stock available",
    });
    expect(confirmed.currentStage).toBe("PHARMACY_CONFIRMATION");
    expect(confirmed.currentStatus).toBe("COMPLETED");
    expect(confirmed.updatedAt.getTime()).toBeGreaterThanOrEqual(
      order.createdAt.getTime(),
    );
  });

  it("adds timeline entry for confirmation", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      pharmacyId: PHARMACY,
    });
    const tl = svc.getTimeline({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(tl).toHaveLength(2);
    expect(tl[1]?.stage).toBe("PHARMACY_CONFIRMATION");
    expect(tl[1]?.status).toBe("COMPLETED");
  });

  it("throws if order is not at CONSUMER_ORDER stage", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      pharmacyId: PHARMACY,
    });
    expect(() =>
      svc.confirmPharmacy({
        organizationId: ORG,
        marketCode: "AO",
        orderId: order.id,
        pharmacyId: PHARMACY,
      }),
    ).toThrow(BadRequestException);
  });
});

describe("B2b2cService — pullFromSupplier", () => {
  it("transitions from PHARMACY_CONFIRMATION to SUPPLIER_PULL", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      pharmacyId: PHARMACY,
    });
    const pulled = svc.pullFromSupplier({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      supplierId: SUPPLIER,
      note: "Stock pulled",
    });
    expect(pulled.currentStage).toBe("SUPPLIER_PULL");
    expect(pulled.currentStatus).toBe("IN_PROGRESS");
    expect(pulled.supplierId).toBe(SUPPLIER);
    expect(pulled.stockSource).toBe("SUPPLIER_PULL");
  });

  it("throws if not at PHARMACY_CONFIRMATION", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    expect(() =>
      svc.pullFromSupplier({
        organizationId: ORG,
        marketCode: "AO",
        orderId: order.id,
        supplierId: SUPPLIER,
      }),
    ).toThrow(BadRequestException);
  });
});

describe("B2b2cService — markDelivered", () => {
  it("transitions from SUPPLIER_PULL to DELIVERY", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      pharmacyId: PHARMACY,
    });
    svc.pullFromSupplier({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      supplierId: SUPPLIER,
    });
    const delivered = svc.markDelivered({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(delivered.currentStage).toBe("DELIVERY");
    expect(delivered.currentStatus).toBe("COMPLETED");
  });

  it("transitions from PHARMACY_CONFIRMATION directly to DELIVERY", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      pharmacyId: PHARMACY,
    });
    const delivered = svc.markDelivered({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(delivered.currentStage).toBe("DELIVERY");
  });

  it("throws if already delivered", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      pharmacyId: PHARMACY,
    });
    svc.markDelivered({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(() =>
      svc.markDelivered({
        organizationId: ORG,
        marketCode: "AO",
        orderId: order.id,
      }),
    ).toThrow(BadRequestException);
  });

  it("adds timeline entry for delivery", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      pharmacyId: PHARMACY,
    });
    svc.markDelivered({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    const tl = svc.getTimeline({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(tl).toHaveLength(3);
    expect(tl[2]?.stage).toBe("DELIVERY");
    expect(tl[2]?.responsibleParty).toBe("PLATFORM");
  });
});

describe("B2b2cService — full B2B2C flow", () => {
  it("consumer_order → pharmacy_confirm → supplier_pull → delivery", () => {
    const svc = new B2b2cService();
    const order = svc.createOrder(baseOrder);
    expect(order.currentStage).toBe("CONSUMER_ORDER");

    svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      pharmacyId: PHARMACY,
    });

    svc.pullFromSupplier({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      supplierId: SUPPLIER,
    });

    svc.markDelivered({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });

    const final = svc.getOrder({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(final.currentStage).toBe("DELIVERY");
    expect(final.currentStatus).toBe("COMPLETED");

    const tl = svc.getTimeline({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(tl).toHaveLength(4);
    expect(tl.map((e) => e.stage)).toEqual([
      "CONSUMER_ORDER",
      "PHARMACY_CONFIRMATION",
      "SUPPLIER_PULL",
      "DELIVERY",
    ]);
  });
});
