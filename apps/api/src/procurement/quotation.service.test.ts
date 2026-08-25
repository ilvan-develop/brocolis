import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { QuotationService } from "./quotation.service.js";

describe("QuotationService", () => {
  let svc: QuotationService;
  const org = "00000000-0000-4000-8000-000000000000";
  const market = "AO";
  const rfqId = "c1234567890abcdef00000002";
  const supplierId = "c1234567890abcdef00000001";

  beforeEach(() => {
    svc = new QuotationService();
  });

  it("creates quotation with items", () => {
    const qt = svc.create({
      organizationId: org,
      marketCode: market,
      rfqId,
      supplierId,
      totalAmountMinor: 50000,
      items: [{ productId: "prod-1", quantity: 10, unitPriceMinor: 5000 }],
    });
    expect(qt.status).toBe("DRAFT");
    expect(qt.items).toHaveLength(1);
    expect(qt.reference).toMatch(/^QT-/);
    expect(qt.items[0]!.productId).toBe("prod-1");
  });

  it("creates quotation with optional fields", () => {
    const qt = svc.create({
      organizationId: org,
      marketCode: market,
      rfqId,
      supplierId,
      totalAmountMinor: 10000,
      currency: "USD",
      validUntil: new Date("2026-12-31"),
      notes: "Urgente",
      items: [{ productId: "prod-1", quantity: 1, unitPriceMinor: 10000 }],
    });
    expect(qt.currency).toBe("USD");
    expect(qt.validUntil).toBeDefined();
    expect(qt.notes).toBe("Urgente");
  });

  it("advances quotation from DRAFT to SUBMITTED (scoped)", () => {
    const qt = svc.create({
      organizationId: org,
      marketCode: market,
      rfqId: "c1234567890abcdef00000003",
      supplierId,
      totalAmountMinor: 75000,
      items: [{ productId: "prod-1", quantity: 15, unitPriceMinor: 5000 }],
    });
    const submitted = svc.advanceStatus(org, market, qt.id, "SUBMITTED");
    expect(submitted.status).toBe("SUBMITTED");
  });

  it("rejects transition DRAFT → ACCEPTED", () => {
    const qt = svc.create({
      organizationId: org,
      marketCode: market,
      rfqId: "c1234567890abcdef00000004",
      supplierId,
      totalAmountMinor: 10000,
      items: [{ productId: "prod-1", quantity: 2, unitPriceMinor: 5000 }],
    });
    expect(() => svc.advanceStatus(org, market, qt.id, "ACCEPTED")).toThrow(
      BadRequestException,
    );
  });

  it("advances SUBMITTED → ACCEPTED", () => {
    const qt = svc.create({
      organizationId: org,
      marketCode: market,
      rfqId: "c1234567890abcdef00000005",
      supplierId,
      totalAmountMinor: 10000,
      items: [{ productId: "prod-1", quantity: 2, unitPriceMinor: 5000 }],
    });
    svc.advanceStatus(org, market, qt.id, "SUBMITTED");
    const accepted = svc.advanceStatus(org, market, qt.id, "ACCEPTED");
    expect(accepted.status).toBe("ACCEPTED");
  });

  it("advances SUBMITTED → REJECTED", () => {
    const qt = svc.create({
      organizationId: org,
      marketCode: market,
      rfqId: "c1234567890abcdef00000006",
      supplierId,
      totalAmountMinor: 10000,
      items: [{ productId: "prod-1", quantity: 2, unitPriceMinor: 5000 }],
    });
    svc.advanceStatus(org, market, qt.id, "SUBMITTED");
    const rejected = svc.advanceStatus(org, market, qt.id, "REJECTED");
    expect(rejected.status).toBe("REJECTED");
  });

  it("advances SUBMITTED → EXPIRED", () => {
    const qt = svc.create({
      organizationId: org,
      marketCode: market,
      rfqId: "c1234567890abcdef00000007",
      supplierId,
      totalAmountMinor: 10000,
      items: [{ productId: "prod-1", quantity: 2, unitPriceMinor: 5000 }],
    });
    svc.advanceStatus(org, market, qt.id, "SUBMITTED");
    const expired = svc.advanceStatus(org, market, qt.id, "EXPIRED");
    expect(expired.status).toBe("EXPIRED");
  });

  it("rejects invalid transition ACCEPTED → DRAFT", () => {
    const qt = svc.create({
      organizationId: org,
      marketCode: market,
      rfqId: "c1234567890abcdef00000008",
      supplierId,
      totalAmountMinor: 10000,
      items: [{ productId: "prod-1", quantity: 2, unitPriceMinor: 5000 }],
    });
    svc.advanceStatus(org, market, qt.id, "SUBMITTED");
    svc.advanceStatus(org, market, qt.id, "ACCEPTED");
    expect(() => svc.advanceStatus(org, market, qt.id, "DRAFT")).toThrow(
      BadRequestException,
    );
  });
});
