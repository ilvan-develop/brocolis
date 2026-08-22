import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { ApprovalService } from "./approval.service.js";
import { CreditService } from "./credit.service.js";
import { PurchaseOrderService } from "./purchase-order.service.js";
import { QuotationService } from "./quotation.service.js";
import { RfqService } from "./rfq.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const OTHER_ORG = "11111111-1111-4111-8111-111111111111";
const SUP = "c1234567890abcdef00000001";
const PROD = "c1234567890abcdef00000021";

describe("RfqService", () => {
  it("creates RFQ in DRAFT status with auto-generated reference", () => {
    const svc = new RfqService();
    const rfq = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "Compra de Paracetamol",
    });
    expect(rfq.status).toBe("DRAFT");
    expect(rfq.reference).toMatch(/^RFQ-/);
    expect(rfq.organizationId).toBe(ORG);
  });

  it("advances RFQ from DRAFT to OPEN", () => {
    const svc = new RfqService();
    const rfq = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "Teste",
    });
    const opened = svc.advanceStatus(rfq.id, "OPEN");
    expect(opened.status).toBe("OPEN");
  });

  it("rejects invalid transition DRAFT → AWARDED", () => {
    const svc = new RfqService();
    const rfq = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "Teste",
    });
    expect(() => svc.advanceStatus(rfq.id, "AWARDED")).toThrow(
      BadRequestException,
    );
  });

  it("getById respects tenant scope", () => {
    const svc = new RfqService();
    const rfq = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "Scoped",
    });
    expect(() => svc.getById(OTHER_ORG, "AO", rfq.id)).toThrow(
      NotFoundException,
    );
    const found = svc.getById(ORG, "AO", rfq.id);
    expect(found.id).toBe(rfq.id);
  });

  it("listByOrg filters by status", () => {
    const svc = new RfqService();
    svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "A",
    });
    svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "B",
    });
    const all = svc.listByOrg({
      organizationId: ORG,
      marketCode: "AO",
    });
    expect(all.items).toHaveLength(2);
    expect(all.total).toBe(2);
  });
});

describe("QuotationService", () => {
  it("creates quotation with items", () => {
    const svc = new QuotationService();
    const qt = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      rfqId: "c1234567890abcdef00000002",
      supplierId: SUP,
      totalAmountMinor: 50000,
      items: [{ productId: PROD, quantity: 10, unitPriceMinor: 5000 }],
    });
    expect(qt.status).toBe("DRAFT");
    expect(qt.items).toHaveLength(1);
    expect(qt.reference).toMatch(/^QT-/);
  });

  it("advances quotation from DRAFT to SUBMITTED", () => {
    const svc = new QuotationService();
    const qt = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      rfqId: "c1234567890abcdef00000003",
      supplierId: SUP,
      totalAmountMinor: 75000,
      items: [{ productId: PROD, quantity: 15, unitPriceMinor: 5000 }],
    });
    const submitted = svc.advanceStatus(qt.id, "SUBMITTED");
    expect(submitted.status).toBe("SUBMITTED");
  });

  it("rejects transition DRAFT → ACCEPTED", () => {
    const svc = new QuotationService();
    const qt = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      rfqId: "c1234567890abcdef00000004",
      supplierId: SUP,
      totalAmountMinor: 10000,
      items: [{ productId: PROD, quantity: 2, unitPriceMinor: 5000 }],
    });
    expect(() => svc.advanceStatus(qt.id, "ACCEPTED")).toThrow(
      BadRequestException,
    );
  });
});

describe("PurchaseOrderService", () => {
  it("creates PO in DRAFT status", () => {
    const svc = new PurchaseOrderService();
    const po = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      totalAmountMinor: 100000,
      items: [
        {
          productId: PROD,
          quantity: 20,
          unitPriceMinor: 5000,
          lineTotalMinor: 100000,
          currency: "AOA",
        },
      ],
    });
    expect(po.status).toBe("DRAFT");
    expect(po.reference).toMatch(/^PO-/);
  });

  it("advances PO through full lifecycle", () => {
    const svc = new PurchaseOrderService();
    const po = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      totalAmountMinor: 100000,
      items: [
        {
          productId: PROD,
          quantity: 20,
          unitPriceMinor: 5000,
          lineTotalMinor: 100000,
          currency: "AOA",
        },
      ],
    });
    let current = svc.advanceStatus(po.id, "PENDING_APPROVAL");
    expect(current.status).toBe("PENDING_APPROVAL");
    current = svc.advanceStatus(po.id, "APPROVED");
    expect(current.status).toBe("APPROVED");
    current = svc.advanceStatus(po.id, "CONFIRMED");
    expect(current.status).toBe("CONFIRMED");
    current = svc.advanceStatus(po.id, "IN_DELIVERY");
    expect(current.status).toBe("IN_DELIVERY");
    current = svc.advanceStatus(po.id, "DELIVERED");
    expect(current.status).toBe("DELIVERED");
    current = svc.advanceStatus(po.id, "COMPLETED");
    expect(current.status).toBe("COMPLETED");
  });

  it("rejects jump from DRAFT to CONFIRMED", () => {
    const svc = new PurchaseOrderService();
    const po = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      totalAmountMinor: 10000,
      items: [
        {
          productId: PROD,
          quantity: 2,
          unitPriceMinor: 5000,
          lineTotalMinor: 10000,
          currency: "AOA",
        },
      ],
    });
    expect(() => svc.advanceStatus(po.id, "CONFIRMED")).toThrow(
      BadRequestException,
    );
  });

  it("getById respects scope", () => {
    const svc = new PurchaseOrderService();
    const po = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      totalAmountMinor: 10000,
      items: [
        {
          productId: PROD,
          quantity: 2,
          unitPriceMinor: 5000,
          lineTotalMinor: 10000,
          currency: "AOA",
        },
      ],
    });
    expect(() => svc.getById(OTHER_ORG, "AO", po.id)).toThrow(
      NotFoundException,
    );
  });
});

describe("ApprovalService", () => {
  it("creates approval in PENDING status", () => {
    const svc = new ApprovalService();
    const approval = svc.create("po-1", "user-1");
    expect(approval.status).toBe("PENDING");
    expect(approval.level).toBe(1);
  });

  it("decides approval with APPROVED", () => {
    const svc = new ApprovalService();
    const approval = svc.create("po-1", "user-1");
    const decided = svc.decide({
      approvalId: approval.id,
      decision: "APPROVED",
      approverId: "user-1",
    });
    expect(decided.status).toBe("APPROVED");
    expect(decided.decidedAt).toBeDefined();
  });

  it("rejects decision by wrong approver", () => {
    const svc = new ApprovalService();
    const approval = svc.create("po-1", "user-1");
    expect(() =>
      svc.decide({
        approvalId: approval.id,
        decision: "APPROVED",
        approverId: "user-2",
      }),
    ).toThrow(BadRequestException);
  });

  it("rejects double decision", () => {
    const svc = new ApprovalService();
    const approval = svc.create("po-1", "user-1");
    svc.decide({
      approvalId: approval.id,
      decision: "APPROVED",
      approverId: "user-1",
    });
    expect(() =>
      svc.decide({
        approvalId: approval.id,
        decision: "REJECTED",
        approverId: "user-1",
      }),
    ).toThrow(BadRequestException);
  });

  it("hasApproval returns true when all approved", () => {
    const svc = new ApprovalService();
    const a1 = svc.create("po-1", "user-1", 1);
    const a2 = svc.create("po-1", "user-2", 2);
    svc.decide({
      approvalId: a1.id,
      decision: "APPROVED",
      approverId: "user-1",
    });
    svc.decide({
      approvalId: a2.id,
      decision: "APPROVED",
      approverId: "user-2",
    });
    expect(svc.hasApproval("po-1")).toBe(true);
  });

  it("hasApproval returns false when pending", () => {
    const svc = new ApprovalService();
    svc.create("po-1", "user-1", 1);
    svc.create("po-1", "user-2", 2);
    expect(svc.hasApproval("po-1")).toBe(false);
  });
});

describe("CreditService", () => {
  it("creates credit account", () => {
    const svc = new CreditService();
    const acc = svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      creditLimitMinor: 1000000,
    });
    expect(acc.status).toBe("ACTIVE");
    expect(acc.creditLimitMinor).toBe(1000000);
    expect(acc.balanceMinor).toBe(0);
  });

  it("check returns available when within limit", () => {
    const svc = new CreditService();
    svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      creditLimitMinor: 1000000,
    });
    const result = svc.check({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      amountMinor: 500000,
    });
    expect(result.available).toBe(true);
  });

  it("check returns unavailable when exceeding limit", () => {
    const svc = new CreditService();
    svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      creditLimitMinor: 100000,
    });
    const result = svc.check({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      amountMinor: 200000,
    });
    expect(result.available).toBe(false);
  });

  it("debit increases balance and credit decreases it", () => {
    const svc = new CreditService();
    svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      creditLimitMinor: 1000000,
    });
    svc.debit(ORG, SUP, 300000);
    const afterDebit = svc.getAccount(ORG, SUP);
    expect(afterDebit?.balanceMinor).toBe(300000);
    svc.credit(ORG, SUP, 100000);
    const afterCredit = svc.getAccount(ORG, SUP);
    expect(afterCredit?.balanceMinor).toBe(200000);
  });

  it("debit rejects when exceeding limit", () => {
    const svc = new CreditService();
    svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      creditLimitMinor: 100000,
    });
    expect(() => svc.debit(ORG, SUP, 200000)).toThrow(BadRequestException);
  });

  it("check rejects for non-existent account", () => {
    const svc = new CreditService();
    expect(() =>
      svc.check({
        organizationId: ORG,
        marketCode: "AO",
        supplierId: "non-existent",
        amountMinor: 1000,
      }),
    ).toThrow(NotFoundException);
  });
});
