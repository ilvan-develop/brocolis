import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { InvoiceService } from "./invoice.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const MARKET = "AO";
const SUP = "c1234567890abcdef00000001";

function makePo(id: string, status: string) {
  return {
    id,
    organizationId: ORG,
    marketCode: MARKET,
    supplierId: SUP,
    reference: `PO-${id}`,
    status: status as any,
    totalAmountMinor: 10000,
    currency: "AOA",
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("InvoiceService", () => {
  let svc: InvoiceService;

  beforeEach(() => {
    svc = new InvoiceService();
  });

  it("issues an invoice only when the PO is DELIVERED or COMPLETED", () => {
    const draftPo = makePo("po-draft", "DRAFT");
    expect(() => svc.issue(ORG, MARKET, draftPo)).toThrow(BadRequestException);

    const deliveredPo = makePo("po-delivered", "DELIVERED");
    const invoice = svc.issue(ORG, MARKET, deliveredPo);
    expect(invoice.status).toBe("ISSUED");
    expect(invoice.invoiceNumber).toMatch(/^INV-/);
    expect(invoice.totalAmountMinor).toBe(10000);
    expect(invoice.currency).toBe("AOA");
    expect(invoice.organizationId).toBe(ORG);
    expect(invoice.marketCode).toBe(MARKET);
    expect(invoice.purchaseOrderId).toBe("po-delivered");
    expect(invoice.supplierId).toBe(SUP);
    expect(invoice.issuedAt).toBeInstanceOf(Date);
  });

  it("issues an invoice for COMPLETED PO", () => {
    const completedPo = makePo("po-completed", "COMPLETED");
    const invoice = svc.issue(ORG, MARKET, completedPo);
    expect(invoice.status).toBe("ISSUED");
  });

  it("rejects invoice for PENDING_APPROVAL PO", () => {
    const po = makePo("po-pending", "PENDING_APPROVAL");
    expect(() => svc.issue(ORG, MARKET, po)).toThrow(BadRequestException);
  });

  it("rejects invoice for CONFIRMED PO", () => {
    const po = makePo("po-confirmed", "CONFIRMED");
    expect(() => svc.issue(ORG, MARKET, po)).toThrow(BadRequestException);
  });

  it("rejects invoice for IN_DELIVERY PO", () => {
    const po = makePo("po-in-delivery", "IN_DELIVERY");
    expect(() => svc.issue(ORG, MARKET, po)).toThrow(BadRequestException);
  });

  it("is idempotent per purchase order", () => {
    const deliveredPo = makePo("po-idempotent", "DELIVERED");
    const first = svc.issue(ORG, MARKET, deliveredPo);
    const second = svc.issue(ORG, MARKET, deliveredPo);
    expect(second.id).toBe(first.id);
    expect(second.status).toBe("ISSUED");
  });

  it("getById returns invoice when found", () => {
    const deliveredPo = makePo("po-get-by-id", "DELIVERED");
    const invoice = svc.issue(ORG, MARKET, deliveredPo);
    const found = svc.getById(ORG, MARKET, invoice.id);
    expect(found.id).toBe(invoice.id);
  });

  it("getById respects tenant scope", () => {
    const deliveredPo = makePo("po-scope", "DELIVERED");
    const invoice = svc.issue(ORG, MARKET, deliveredPo);
    expect(() =>
      svc.getById("11111111-1111-4111-8111-111111111111", MARKET, invoice.id),
    ).toThrow(NotFoundException);
  });

  it("getById throws NotFoundException for missing id", () => {
    expect(() => svc.getById(ORG, MARKET, "non-existent")).toThrow(
      NotFoundException,
    );
  });

  it("listByOrg returns invoices for org+market", () => {
    svc.issue(ORG, MARKET, makePo("po-list-1", "DELIVERED"));
    svc.issue(ORG, MARKET, makePo("po-list-2", "COMPLETED"));
    svc.issue(
      "11111111-1111-4111-8111-111111111111",
      MARKET,
      makePo("po-list-3", "DELIVERED"),
    );

    const result = svc.listByOrg(ORG, MARKET);
    expect(result).toHaveLength(2);
  });

  it("listByOrg sorts by createdAt desc", async () => {
    const first = svc.issue(ORG, MARKET, makePo("po-sort-1", "DELIVERED"));
    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = svc.issue(ORG, MARKET, makePo("po-sort-2", "COMPLETED"));

    const result = svc.listByOrg(ORG, MARKET);
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe(second.id);
    expect(result[1]!.id).toBe(first.id);
  });

  it("listByOrg returns empty array when no invoices", () => {
    const result = svc.listByOrg(ORG, MARKET);
    expect(result).toHaveLength(0);
  });
});
