import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { PurchaseOrderService } from "./purchase-order.service.js";

describe("PurchaseOrderService", () => {
  let svc: PurchaseOrderService;
  const org = "00000000-0000-4000-8000-000000000000";
  const market = "AO";
  const supplierId = "c1234567890abcdef00000001";

  beforeEach(() => {
    svc = new PurchaseOrderService();
  });

  const baseInput = {
    organizationId: org,
    marketCode: market,
    supplierId,
    totalAmountMinor: 100000,
    items: [
      {
        productId: "prod-1",
        quantity: 20,
        unitPriceMinor: 5000,
        lineTotalMinor: 100000,
        currency: "AOA",
      },
    ],
  };

  it("creates PO in DRAFT status", () => {
    const po = svc.create(baseInput);
    expect(po.status).toBe("DRAFT");
    expect(po.reference).toMatch(/^PO-/);
    expect(po.items).toHaveLength(1);
    expect(po.currency).toBe("AOA");
  });

  it("creates PO with optional fields", () => {
    const po = svc.create({
      ...baseInput,
      quotationId: "qt-1",
      requestedDeliveryDate: new Date("2026-12-31"),
      notes: "Entregar urgente",
    });
    expect(po.quotationId).toBe("qt-1");
    expect(po.requestedDeliveryDate).toBeDefined();
    expect(po.notes).toBe("Entregar urgente");
  });

  it("advances PO status step by step (scoped) and rejects skipping steps", () => {
    const po = svc.create(baseInput);
    let current = svc.advanceStatus(org, market, po.id, "PENDING_APPROVAL");
    expect(current.status).toBe("PENDING_APPROVAL");
    current = svc.advanceStatus(org, market, po.id, "APPROVED");
    expect(current.status).toBe("APPROVED");
    current = svc.advanceStatus(org, market, po.id, "CONFIRMED");
    expect(current.status).toBe("CONFIRMED");
    current = svc.advanceStatus(org, market, po.id, "IN_DELIVERY");
    expect(current.status).toBe("IN_DELIVERY");
    current = svc.advanceStatus(org, market, po.id, "DELIVERED");
    expect(current.status).toBe("DELIVERED");
    current = svc.advanceStatus(org, market, po.id, "COMPLETED");
    expect(current.status).toBe("COMPLETED");
  });

  it("rejects jump from DRAFT to CONFIRMED", () => {
    const po = svc.create(baseInput);
    expect(() => svc.advanceStatus(org, market, po.id, "CONFIRMED")).toThrow(
      BadRequestException,
    );
  });

  it("rejects jump from DRAFT to APPROVED", () => {
    const po = svc.create(baseInput);
    expect(() => svc.advanceStatus(org, market, po.id, "APPROVED")).toThrow(
      BadRequestException,
    );
  });

  it("rejects jump from PENDING_APPROVAL to CONFIRMED", () => {
    const po = svc.create(baseInput);
    svc.advanceStatus(org, market, po.id, "PENDING_APPROVAL");
    expect(() => svc.advanceStatus(org, market, po.id, "CONFIRMED")).toThrow(
      BadRequestException,
    );
  });

  it("rejects jump from CONFIRMED to COMPLETED", () => {
    const po = svc.create(baseInput);
    svc.advanceStatus(org, market, po.id, "PENDING_APPROVAL");
    svc.advanceStatus(org, market, po.id, "APPROVED");
    svc.advanceStatus(org, market, po.id, "CONFIRMED");
    expect(() => svc.advanceStatus(org, market, po.id, "COMPLETED")).toThrow(
      BadRequestException,
    );
  });

  it("rejects jump from DELIVERED back to IN_DELIVERY", () => {
    const po = svc.create(baseInput);
    svc.advanceStatus(org, market, po.id, "PENDING_APPROVAL");
    svc.advanceStatus(org, market, po.id, "APPROVED");
    svc.advanceStatus(org, market, po.id, "CONFIRMED");
    svc.advanceStatus(org, market, po.id, "IN_DELIVERY");
    svc.advanceStatus(org, market, po.id, "DELIVERED");
    expect(() => svc.advanceStatus(org, market, po.id, "IN_DELIVERY")).toThrow(
      BadRequestException,
    );
  });

  it("getById returns PO when found", () => {
    const po = svc.create(baseInput);
    const found = svc.getById(org, market, po.id);
    expect(found.id).toBe(po.id);
    expect(found.status).toBe("DRAFT");
  });

  it("getById respects scope", () => {
    const po = svc.create(baseInput);
    expect(() =>
      svc.getById("11111111-1111-4111-8111-111111111111", market, po.id),
    ).toThrow(NotFoundException);
  });

  it("listByOrg returns all POs for org+market", () => {
    svc.create(baseInput);
    svc.create({ ...baseInput, totalAmountMinor: 200000 });
    svc.create({
      ...baseInput,
      organizationId: "11111111-1111-4111-8111-111111111111",
      totalAmountMinor: 300000,
    });

    const result = svc.listByOrg(org, market);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("listByOrg supports pagination", () => {
    for (let i = 0; i < 5; i++) {
      svc.create({ ...baseInput, totalAmountMinor: (i + 1) * 1000 });
    }

    const page1 = svc.listByOrg(org, market, undefined, 1, 2);
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);

    const page2 = svc.listByOrg(org, market, undefined, 2, 2);
    expect(page2.items).toHaveLength(2);
  });
});
