import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { RfqService } from "./rfq.service.js";

describe("RfqService", () => {
  let svc: RfqService;
  const org = "00000000-0000-4000-8000-000000000000";
  const market = "AO";
  const supplierId = "c1234567890abcdef00000001";

  beforeEach(() => {
    svc = new RfqService();
  });

  it("creates RFQ in DRAFT status with auto-generated reference", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Compra de Paracetamol",
    });
    expect(rfq.status).toBe("DRAFT");
    expect(rfq.reference).toMatch(/^RFQ-/);
    expect(rfq.organizationId).toBe(org);
    expect(rfq.marketCode).toBe(market);
    expect(rfq.supplierId).toBe(supplierId);
    expect(rfq.subject).toBe("Compra de Paracetamol");
  });

  it("creates RFQ with optional fields", () => {
    const validUntil = new Date("2026-12-31");
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
      validUntil,
      notes: "Nota importante",
    });
    expect(rfq.validUntil).toEqual(validUntil);
    expect(rfq.notes).toBe("Nota importante");
  });

  it("advances RFQ from DRAFT to OPEN (scoped)", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    const opened = svc.advanceStatus(org, market, rfq.id, "OPEN");
    expect(opened.status).toBe("OPEN");
    expect(opened.updatedAt).toBeInstanceOf(Date);
  });

  it("advances RFQ from OPEN to QUOTED", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    svc.advanceStatus(org, market, rfq.id, "OPEN");
    const quoted = svc.advanceStatus(org, market, rfq.id, "QUOTED");
    expect(quoted.status).toBe("QUOTED");
  });

  it("advances RFQ from QUOTED to AWARDED", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    svc.advanceStatus(org, market, rfq.id, "OPEN");
    svc.advanceStatus(org, market, rfq.id, "QUOTED");
    const awarded = svc.advanceStatus(org, market, rfq.id, "AWARDED");
    expect(awarded.status).toBe("AWARDED");
  });

  it("allows CANCELED from DRAFT", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    const canceled = svc.advanceStatus(org, market, rfq.id, "CANCELED");
    expect(canceled.status).toBe("CANCELED");
  });

  it("allows CANCELED from OPEN", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    svc.advanceStatus(org, market, rfq.id, "OPEN");
    const canceled = svc.advanceStatus(org, market, rfq.id, "CANCELED");
    expect(canceled.status).toBe("CANCELED");
  });

  it("allows CANCELED from QUOTED", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    svc.advanceStatus(org, market, rfq.id, "OPEN");
    svc.advanceStatus(org, market, rfq.id, "QUOTED");
    const canceled = svc.advanceStatus(org, market, rfq.id, "CANCELED");
    expect(canceled.status).toBe("CANCELED");
  });

  it("allows EXPIRED from OPEN", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    svc.advanceStatus(org, market, rfq.id, "OPEN");
    const expired = svc.advanceStatus(org, market, rfq.id, "EXPIRED");
    expect(expired.status).toBe("EXPIRED");
  });

  it("rejects invalid transition DRAFT → AWARDED", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    expect(() => svc.advanceStatus(org, market, rfq.id, "AWARDED")).toThrow(
      BadRequestException,
    );
  });

  it("rejects invalid transition DRAFT → QUOTED", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    expect(() => svc.advanceStatus(org, market, rfq.id, "QUOTED")).toThrow(
      BadRequestException,
    );
  });

  it("rejects invalid transition OPEN → AWARDED", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    svc.advanceStatus(org, market, rfq.id, "OPEN");
    expect(() => svc.advanceStatus(org, market, rfq.id, "AWARDED")).toThrow(
      BadRequestException,
    );
  });

  it("rejects invalid transition QUOTED → OPEN", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Teste",
    });
    svc.advanceStatus(org, market, rfq.id, "OPEN");
    svc.advanceStatus(org, market, rfq.id, "QUOTED");
    expect(() => svc.advanceStatus(org, market, rfq.id, "OPEN")).toThrow(
      BadRequestException,
    );
  });

  it("advanceStatus rejects cross-tenant access with 404", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Scoped",
    });
    expect(() =>
      svc.advanceStatus(
        "11111111-1111-4111-8111-111111111111",
        market,
        rfq.id,
        "OPEN",
      ),
    ).toThrow(NotFoundException);
  });

  it("getById respects tenant scope", () => {
    const rfq = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "Scoped",
    });
    expect(() =>
      svc.getById("11111111-1111-4111-8111-111111111111", market, rfq.id),
    ).toThrow(NotFoundException);
    const found = svc.getById(org, market, rfq.id);
    expect(found.id).toBe(rfq.id);
  });

  it("listByOrg filters by status", () => {
    svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "A",
    });
    svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "B",
    });
    const all = svc.listByOrg({ organizationId: org, marketCode: market });
    expect(all.items).toHaveLength(2);
    expect(all.total).toBe(2);
  });

  it("listByOrg filters by status when provided", () => {
    const r1 = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "A",
    });
    svc.advanceStatus(org, market, r1.id, "OPEN");
    svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      subject: "B",
    });

    const open = svc.listByOrg({
      organizationId: org,
      marketCode: market,
      status: "OPEN",
    });
    expect(open.items).toHaveLength(1);
    expect(open.total).toBe(1);
    expect(open.items[0]!.status).toBe("OPEN");
  });
});
