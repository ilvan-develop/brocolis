import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { ComplianceService } from "../compliance/compliance.service.js";
import { ApprovalService } from "./approval.service.js";
import { CreditService } from "./credit.service.js";
import { InvoiceService } from "./invoice.service.js";
import { PricingService } from "./pricing.service.js";
import { ProcurementService } from "./procurement.service.js";
import { PurchaseOrderService } from "./purchase-order.service.js";
import { QuotationService } from "./quotation.service.js";
import { RfqService } from "./rfq.service.js";
import { SupplierService } from "./supplier.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const OTHER_ORG = "11111111-1111-4111-8111-111111111111";
const MARKET = "AO";
const SUP = "c1234567890abcdef00000001";
const PROD = "c1234567890abcdef00000021";

function makeProcurementServices() {
  const supplierService = new SupplierService();
  const rfqService = new RfqService();
  const quotationService = new QuotationService();
  const poService = new PurchaseOrderService();
  const approvalService = new ApprovalService();
  const creditService = new CreditService();
  const pricingService = new PricingService(supplierService);
  const invoiceService = new InvoiceService();
  const complianceService = new ComplianceService();
  const procurement = new ProcurementService(
    supplierService,
    rfqService,
    quotationService,
    poService,
    approvalService,
    creditService,
    pricingService,
    invoiceService,
    complianceService,
  );
  return {
    supplierService,
    rfqService,
    quotationService,
    poService,
    approvalService,
    creditService,
    pricingService,
    invoiceService,
    complianceService,
    procurement,
  };
}

/** Cria um fornecedor real (as demais entidades exigem um supplierId válido e scoped). */
function makeSupplier(procurement: ProcurementService, name = "Fornecedor A") {
  return procurement.createSupplier({
    organizationId: ORG,
    marketCode: MARKET,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
  });
}

describe("RfqService", () => {
  it("creates RFQ in DRAFT status with auto-generated reference", () => {
    const svc = new RfqService();
    const rfq = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      subject: "Compra de Paracetamol",
    });
    expect(rfq.status).toBe("DRAFT");
    expect(rfq.reference).toMatch(/^RFQ-/);
    expect(rfq.organizationId).toBe(ORG);
  });

  it("advances RFQ from DRAFT to OPEN (scoped)", () => {
    const svc = new RfqService();
    const rfq = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      subject: "Teste",
    });
    const opened = svc.advanceStatus(ORG, MARKET, rfq.id, "OPEN");
    expect(opened.status).toBe("OPEN");
  });

  it("rejects invalid transition DRAFT → AWARDED", () => {
    const svc = new RfqService();
    const rfq = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      subject: "Teste",
    });
    expect(() => svc.advanceStatus(ORG, MARKET, rfq.id, "AWARDED")).toThrow(
      BadRequestException,
    );
  });

  it("advanceStatus rejects cross-tenant access with 404", () => {
    const svc = new RfqService();
    const rfq = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      subject: "Teste",
    });
    expect(() =>
      svc.advanceStatus(OTHER_ORG, MARKET, rfq.id, "OPEN"),
    ).toThrow(NotFoundException);
  });

  it("getById respects tenant scope", () => {
    const svc = new RfqService();
    const rfq = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      subject: "Scoped",
    });
    expect(() => svc.getById(OTHER_ORG, MARKET, rfq.id)).toThrow(
      NotFoundException,
    );
    const found = svc.getById(ORG, MARKET, rfq.id);
    expect(found.id).toBe(rfq.id);
  });

  it("listByOrg filters by status", () => {
    const svc = new RfqService();
    svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      subject: "A",
    });
    svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      subject: "B",
    });
    const all = svc.listByOrg({ organizationId: ORG, marketCode: MARKET });
    expect(all.items).toHaveLength(2);
    expect(all.total).toBe(2);
  });
});

describe("QuotationService", () => {
  it("creates quotation with items", () => {
    const svc = new QuotationService();
    const qt = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      rfqId: "c1234567890abcdef00000002",
      supplierId: SUP,
      totalAmountMinor: 50000,
      items: [{ productId: PROD, quantity: 10, unitPriceMinor: 5000 }],
    });
    expect(qt.status).toBe("DRAFT");
    expect(qt.items).toHaveLength(1);
    expect(qt.reference).toMatch(/^QT-/);
  });

  it("advances quotation from DRAFT to SUBMITTED (scoped)", () => {
    const svc = new QuotationService();
    const qt = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      rfqId: "c1234567890abcdef00000003",
      supplierId: SUP,
      totalAmountMinor: 75000,
      items: [{ productId: PROD, quantity: 15, unitPriceMinor: 5000 }],
    });
    const submitted = svc.advanceStatus(ORG, MARKET, qt.id, "SUBMITTED");
    expect(submitted.status).toBe("SUBMITTED");
  });

  it("rejects transition DRAFT → ACCEPTED", () => {
    const svc = new QuotationService();
    const qt = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      rfqId: "c1234567890abcdef00000004",
      supplierId: SUP,
      totalAmountMinor: 10000,
      items: [{ productId: PROD, quantity: 2, unitPriceMinor: 5000 }],
    });
    expect(() => svc.advanceStatus(ORG, MARKET, qt.id, "ACCEPTED")).toThrow(
      BadRequestException,
    );
  });
});

describe("PurchaseOrderService", () => {
  it("creates PO in DRAFT status", () => {
    const svc = new PurchaseOrderService();
    const po = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
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

  it("advances PO status step by step (scoped) and rejects skipping steps", () => {
    const svc = new PurchaseOrderService();
    const po = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
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
    let current = svc.advanceStatus(ORG, MARKET, po.id, "PENDING_APPROVAL");
    expect(current.status).toBe("PENDING_APPROVAL");
    current = svc.advanceStatus(ORG, MARKET, po.id, "APPROVED");
    expect(current.status).toBe("APPROVED");
    current = svc.advanceStatus(ORG, MARKET, po.id, "CONFIRMED");
    expect(current.status).toBe("CONFIRMED");
    current = svc.advanceStatus(ORG, MARKET, po.id, "IN_DELIVERY");
    expect(current.status).toBe("IN_DELIVERY");
    current = svc.advanceStatus(ORG, MARKET, po.id, "DELIVERED");
    expect(current.status).toBe("DELIVERED");
    current = svc.advanceStatus(ORG, MARKET, po.id, "COMPLETED");
    expect(current.status).toBe("COMPLETED");
  });

  it("rejects jump from DRAFT to CONFIRMED", () => {
    const svc = new PurchaseOrderService();
    const po = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
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
    expect(() => svc.advanceStatus(ORG, MARKET, po.id, "CONFIRMED")).toThrow(
      BadRequestException,
    );
  });

  it("getById respects scope", () => {
    const svc = new PurchaseOrderService();
    const po = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
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
    expect(() => svc.getById(OTHER_ORG, MARKET, po.id)).toThrow(
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
    svc.decide({ approvalId: a1.id, decision: "APPROVED", approverId: "user-1" });
    svc.decide({ approvalId: a2.id, decision: "APPROVED", approverId: "user-2" });
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
      marketCode: MARKET,
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
      marketCode: MARKET,
      supplierId: SUP,
      creditLimitMinor: 1000000,
    });
    const result = svc.check({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      amountMinor: 500000,
    });
    expect(result.available).toBe(true);
  });

  it("check returns unavailable when exceeding limit", () => {
    const svc = new CreditService();
    svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      creditLimitMinor: 100000,
    });
    const result = svc.check({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      amountMinor: 200000,
    });
    expect(result.available).toBe(false);
  });

  it("debit increases balance and credit decreases it", () => {
    const svc = new CreditService();
    svc.create({
      organizationId: ORG,
      marketCode: MARKET,
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
      marketCode: MARKET,
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
        marketCode: MARKET,
        supplierId: "non-existent",
        amountMinor: 1000,
      }),
    ).toThrow(NotFoundException);
  });
});

describe("SupplierService", () => {
  it("creates supplier in ACTIVE status", () => {
    const svc = new SupplierService();
    const supplier = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Distribuidora Central",
      slug: "distribuidora-central",
    });
    expect(supplier.status).toBe("ACTIVE");
    expect(supplier.name).toBe("Distribuidora Central");
  });

  it("getById respects tenant scope", () => {
    const svc = new SupplierService();
    const supplier = svc.create({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Distribuidora Central",
      slug: "distribuidora-central",
    });
    expect(() => svc.getById(OTHER_ORG, MARKET, supplier.id)).toThrow(
      NotFoundException,
    );
    expect(svc.getById(ORG, MARKET, supplier.id).id).toBe(supplier.id);
  });

  it("listByOrg paginates and scopes by org+market", async () => {
    const svc = new SupplierService();
    svc.create({ organizationId: ORG, marketCode: MARKET, name: "A", slug: "a" });
    svc.create({ organizationId: ORG, marketCode: MARKET, name: "B", slug: "b" });
    svc.create({ organizationId: OTHER_ORG, marketCode: MARKET, name: "C", slug: "c" });
    const result = await svc.listByOrg(ORG, MARKET);
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
  });
});

describe("PricingService", () => {
  function setup() {
    const supplierService = new SupplierService();
    const svc = new PricingService(supplierService);
    const supplier = supplierService.create({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Fornecedor Preços",
      slug: "fornecedor-precos",
    });
    return { supplierService, svc, supplierId: supplier.id };
  }

  it("selects the applicable tier and computes lineTotalMinor without volume discount", () => {
    const { svc, supplierId } = setup();
    svc.createPriceTier({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      minQty: 1,
      maxQty: 49,
      unitPriceMinor: 1000,
    });
    svc.createPriceTier({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      minQty: 50,
      unitPriceMinor: 800,
    });
    const result = svc.calculatePrice({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      quantity: 10,
    });
    expect(result.unitPriceMinor).toBe(1000);
    expect(result.lineTotalMinor).toBe(10000);
    expect(result.volumeDiscountBps).toBeUndefined();
  });

  it("selects the most specific (highest minQty) tier that covers the quantity", () => {
    const { svc, supplierId } = setup();
    svc.createPriceTier({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      minQty: 1,
      maxQty: 49,
      unitPriceMinor: 1000,
    });
    svc.createPriceTier({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      minQty: 50,
      unitPriceMinor: 800,
    });
    const result = svc.calculatePrice({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      quantity: 100,
    });
    expect(result.unitPriceMinor).toBe(800);
  });

  it("applies volume discount (basis points) on top of the selected tier", () => {
    const { svc, supplierId } = setup();
    svc.createPriceTier({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      minQty: 1,
      unitPriceMinor: 1000,
    });
    svc.createVolumePrice({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      minVolume: 20,
      discountBps: 1000, // 10%
    });
    const result = svc.calculatePrice({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      quantity: 25,
    });
    expect(result.unitPriceMinor).toBe(900); // 1000 - 10%
    expect(result.volumeDiscountBps).toBe(1000);
    expect(result.lineTotalMinor).toBe(900 * 25);
  });

  it("does not apply volume discount when quantity is below minVolume", () => {
    const { svc, supplierId } = setup();
    svc.createPriceTier({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      minQty: 1,
      unitPriceMinor: 1000,
    });
    svc.createVolumePrice({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      minVolume: 20,
      discountBps: 1000,
    });
    const result = svc.calculatePrice({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId,
      productId: PROD,
      quantity: 5,
    });
    expect(result.unitPriceMinor).toBe(1000);
    expect(result.volumeDiscountBps).toBeUndefined();
  });

  it("throws NotFoundException when no tier is applicable", () => {
    const { svc, supplierId } = setup();
    expect(() =>
      svc.calculatePrice({
        organizationId: ORG,
        marketCode: MARKET,
        supplierId,
        productId: PROD,
        quantity: 5,
      }),
    ).toThrow(NotFoundException);
  });

  it("createPriceTier rejects a supplier outside the tenant scope", () => {
    const { svc } = setup();
    expect(() =>
      svc.createPriceTier({
        organizationId: OTHER_ORG,
        marketCode: MARKET,
        supplierId: "non-existent-supplier-id",
        productId: PROD,
        minQty: 1,
        unitPriceMinor: 1000,
      }),
    ).toThrow(NotFoundException);
  });
});

describe("InvoiceService", () => {
  it("issues an invoice only when the PO is DELIVERED or COMPLETED", () => {
    const svc = new InvoiceService();
    const draftPo = {
      id: "po-1",
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      reference: "PO-1",
      status: "DRAFT" as const,
      totalAmountMinor: 10000,
      currency: "AOA",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(() => svc.issue(ORG, MARKET, draftPo)).toThrow(BadRequestException);

    const deliveredPo = { ...draftPo, status: "DELIVERED" as const };
    const invoice = svc.issue(ORG, MARKET, deliveredPo);
    expect(invoice.status).toBe("ISSUED");
    expect(invoice.invoiceNumber).toMatch(/^INV-/);
    expect(invoice.totalAmountMinor).toBe(10000);
  });

  it("is idempotent per purchase order", () => {
    const svc = new InvoiceService();
    const deliveredPo = {
      id: "po-2",
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      reference: "PO-2",
      status: "DELIVERED" as const,
      totalAmountMinor: 20000,
      currency: "AOA",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const first = svc.issue(ORG, MARKET, deliveredPo);
    const second = svc.issue(ORG, MARKET, deliveredPo);
    expect(second.id).toBe(first.id);
  });

  it("getById respects tenant scope", () => {
    const svc = new InvoiceService();
    const deliveredPo = {
      id: "po-3",
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: SUP,
      reference: "PO-3",
      status: "COMPLETED" as const,
      totalAmountMinor: 30000,
      currency: "AOA",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const invoice = svc.issue(ORG, MARKET, deliveredPo);
    expect(() => svc.getById(OTHER_ORG, MARKET, invoice.id)).toThrow(
      NotFoundException,
    );
  });
});

describe("ProcurementService orchestration (RFQ → Quotation → PO → Approval → Credit → Delivery → Invoice)", () => {
  let ctx: ReturnType<typeof makeProcurementServices>;

  beforeEach(() => {
    ctx = makeProcurementServices();
  });

  it("runs the full happy path end to end", () => {
    const { procurement } = ctx;
    const supplier = makeSupplier(procurement);

    const rfq = procurement.createRfq({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      subject: "Compra trimestral de antibióticos",
    });
    expect(rfq.status).toBe("DRAFT");

    procurement.submitRfq(ORG, MARKET, rfq.id);
    expect(procurement.getRfq(ORG, MARKET, rfq.id).status).toBe("OPEN");

    const quotation = procurement.createQuotation({
      organizationId: ORG,
      marketCode: MARKET,
      rfqId: rfq.id,
      supplierId: supplier.id,
      totalAmountMinor: 500000,
      items: [{ productId: PROD, quantity: 100, unitPriceMinor: 5000 }],
    });

    procurement.submitQuotation(ORG, MARKET, quotation.id);
    // Submeter a cotação avança a RFQ associada para QUOTED.
    expect(procurement.getRfq(ORG, MARKET, rfq.id).status).toBe("QUOTED");

    procurement.acceptQuotation(ORG, MARKET, quotation.id);
    // Aceitar a cotação adjudica a RFQ.
    expect(procurement.getRfq(ORG, MARKET, rfq.id).status).toBe("AWARDED");

    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      quotationId: quotation.id,
      supplierId: supplier.id,
      totalAmountMinor: 500000,
      items: [
        {
          productId: PROD,
          quantity: 100,
          unitPriceMinor: 5000,
          lineTotalMinor: 500000,
          currency: "AOA",
        },
      ],
    });
    expect(po.status).toBe("DRAFT");

    procurement.createCreditAccount({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      creditLimitMinor: 1000000,
    });

    const { po: pendingPo, approvals } = procurement.submitForApproval(
      ORG,
      MARKET,
      po.id,
      ["approver-1", "approver-2"],
    );
    expect(pendingPo.status).toBe("PENDING_APPROVAL");
    expect(approvals).toHaveLength(2);

    // Uma única aprovação (de duas) não deve mover a PO para APPROVED ainda.
    procurement.decideApproval(
      ORG,
      MARKET,
      approvals[0]?.id ?? "",
      "APPROVED",
      "approver-1",
    );
    expect(procurement.getPurchaseOrder(ORG, MARKET, po.id).status).toBe(
      "PENDING_APPROVAL",
    );

    // A segunda aprovação completa o workflow e avança a PO.
    procurement.decideApproval(
      ORG,
      MARKET,
      approvals[1]?.id ?? "",
      "APPROVED",
      "approver-2",
    );
    expect(procurement.getPurchaseOrder(ORG, MARKET, po.id).status).toBe(
      "APPROVED",
    );

    const confirmed = procurement.confirmPurchaseOrder(ORG, MARKET, po.id);
    expect(confirmed.status).toBe("CONFIRMED");
    // Crédito foi debitado ao confirmar.
    expect(procurement.getCreditAccount(ORG, supplier.id)?.balanceMinor).toBe(
      500000,
    );

    procurement.advancePoDelivery(ORG, MARKET, po.id, "IN_DELIVERY");
    procurement.advancePoDelivery(ORG, MARKET, po.id, "DELIVERED");
    // Crédito é libertado ao entregar.
    expect(procurement.getCreditAccount(ORG, supplier.id)?.balanceMinor).toBe(
      0,
    );
    const completed = procurement.advancePoDelivery(
      ORG,
      MARKET,
      po.id,
      "COMPLETED",
    );
    expect(completed.status).toBe("COMPLETED");

    const invoice = procurement.issueInvoice(ORG, MARKET, po.id);
    expect(invoice.status).toBe("ISSUED");
    expect(invoice.totalAmountMinor).toBe(500000);
    expect(procurement.listInvoices(ORG, MARKET)).toHaveLength(1);

    // Todas as mutações críticas devem ter deixado rasto de auditoria.
    const actions = procurement.getAuditEvents().map((e) => e.action);
    expect(actions).toContain("procurement.po.confirmed");
    expect(actions).toContain("procurement.po.approved");
    expect(actions).toContain("procurement.credit.released");
    expect(actions).toContain("procurement.invoice.issued");
  });

  it("blocks confirmPurchaseOrder when the PO is not fully approved", () => {
    const { procurement } = ctx;
    const supplier = makeSupplier(procurement);
    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      totalAmountMinor: 100000,
      items: [
        {
          productId: PROD,
          quantity: 10,
          unitPriceMinor: 10000,
          lineTotalMinor: 100000,
          currency: "AOA",
        },
      ],
    });
    procurement.createCreditAccount({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      creditLimitMinor: 1000000,
    });
    // PO ainda em DRAFT — nem sequer está aprovável.
    expect(() =>
      procurement.confirmPurchaseOrder(ORG, MARKET, po.id),
    ).toThrow(BadRequestException);

    procurement.submitForApproval(ORG, MARKET, po.id, ["approver-1"]);
    // PENDING_APPROVAL, sem decisão ainda — continua bloqueado.
    expect(() =>
      procurement.confirmPurchaseOrder(ORG, MARKET, po.id),
    ).toThrow(BadRequestException);
  });

  it("blocks confirmPurchaseOrder when the credit limit is insufficient", () => {
    const { procurement } = ctx;
    const supplier = makeSupplier(procurement);
    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      totalAmountMinor: 900000,
      items: [
        {
          productId: PROD,
          quantity: 10,
          unitPriceMinor: 90000,
          lineTotalMinor: 900000,
          currency: "AOA",
        },
      ],
    });
    procurement.createCreditAccount({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      creditLimitMinor: 500000, // menor que o total da PO
    });
    const { approvals } = procurement.submitForApproval(ORG, MARKET, po.id, [
      "approver-1",
    ]);
    procurement.decideApproval(
      ORG,
      MARKET,
      approvals[0]?.id ?? "",
      "APPROVED",
      "approver-1",
    );
    expect(procurement.getPurchaseOrder(ORG, MARKET, po.id).status).toBe(
      "APPROVED",
    );
    expect(() =>
      procurement.confirmPurchaseOrder(ORG, MARKET, po.id),
    ).toThrow(BadRequestException);
    // O crédito não deve ter sido debitado.
    expect(procurement.getCreditAccount(ORG, supplier.id)?.balanceMinor).toBe(
      0,
    );
  });

  it("rejecting one approval level rejects the whole PO", () => {
    const { procurement } = ctx;
    const supplier = makeSupplier(procurement);
    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      totalAmountMinor: 100000,
      items: [
        {
          productId: PROD,
          quantity: 10,
          unitPriceMinor: 10000,
          lineTotalMinor: 100000,
          currency: "AOA",
        },
      ],
    });
    const { approvals } = procurement.submitForApproval(ORG, MARKET, po.id, [
      "approver-1",
      "approver-2",
    ]);
    procurement.decideApproval(
      ORG,
      MARKET,
      approvals[0]?.id ?? "",
      "REJECTED",
      "approver-1",
      "Fora do orçamento",
    );
    expect(procurement.getPurchaseOrder(ORG, MARKET, po.id).status).toBe(
      "REJECTED",
    );
  });

  it("createPurchaseOrder requires the linked quotation to be ACCEPTED", () => {
    const { procurement } = ctx;
    const supplier = makeSupplier(procurement);
    const rfq = procurement.createRfq({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      subject: "Teste",
    });
    procurement.submitRfq(ORG, MARKET, rfq.id);
    const quotation = procurement.createQuotation({
      organizationId: ORG,
      marketCode: MARKET,
      rfqId: rfq.id,
      supplierId: supplier.id,
      totalAmountMinor: 10000,
      items: [{ productId: PROD, quantity: 1, unitPriceMinor: 10000 }],
    });
    // Cotação ainda em DRAFT (nem submetida) — não pode gerar PO.
    expect(() =>
      procurement.createPurchaseOrder({
        organizationId: ORG,
        marketCode: MARKET,
        quotationId: quotation.id,
        supplierId: supplier.id,
        totalAmountMinor: 10000,
        items: [
          {
            productId: PROD,
            quantity: 1,
            unitPriceMinor: 10000,
            lineTotalMinor: 10000,
            currency: "AOA",
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it("decideApproval rejects cross-tenant approval ids with 404", () => {
    const { procurement } = ctx;
    const supplier = makeSupplier(procurement);
    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      totalAmountMinor: 100000,
      items: [
        {
          productId: PROD,
          quantity: 10,
          unitPriceMinor: 10000,
          lineTotalMinor: 100000,
          currency: "AOA",
        },
      ],
    });
    const { approvals } = procurement.submitForApproval(ORG, MARKET, po.id, [
      "approver-1",
    ]);
    expect(() =>
      procurement.decideApproval(
        OTHER_ORG,
        MARKET,
        approvals[0]?.id ?? "",
        "APPROVED",
        "approver-1",
      ),
    ).toThrow(NotFoundException);
  });

  it("issueInvoice rejects a PO that has not been delivered yet", () => {
    const { procurement } = ctx;
    const supplier = makeSupplier(procurement);
    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      totalAmountMinor: 100000,
      items: [
        {
          productId: PROD,
          quantity: 10,
          unitPriceMinor: 10000,
          lineTotalMinor: 100000,
          currency: "AOA",
        },
      ],
    });
    expect(() => procurement.issueInvoice(ORG, MARKET, po.id)).toThrow(
      BadRequestException,
    );
  });

  it("requestInvoiceSaftExport delegates to ComplianceService with type=PURCHASES", async () => {
    const { procurement, complianceService } = ctx;
    complianceService.upsertPolicy({ marketCode: MARKET, saftEnabled: true });
    const job = await procurement.requestInvoiceSaftExport({
      organizationId: ORG,
      marketCode: MARKET,
      requestedBy: "finance-user",
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
    });
    expect(job.type).toBe("PURCHASES");
    expect(job.status).toBe("QUEUED");
    expect(
      (await complianceService.listSaftExports(ORG, MARKET)).map((j: any) => j.id),
    ).toContain(job.id);
  });

  it("requestInvoiceSaftExport surfaces the policy error when SAF-T is disabled for the market", () => {
    const { procurement } = ctx;
    expect(() =>
      procurement.requestInvoiceSaftExport({
        organizationId: ORG,
        marketCode: MARKET,
        requestedBy: "finance-user",
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-01-31"),
      }),
    ).toThrow(BadRequestException);
  });

  it("calculatePrice reuses PricingService through the orchestrator", () => {
    const { procurement } = ctx;
    const supplier = makeSupplier(procurement);
    procurement.createPriceTier({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      productId: PROD,
      minQty: 1,
      unitPriceMinor: 2000,
    });
    const result = procurement.calculatePrice({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      productId: PROD,
      quantity: 3,
    });
    expect(result.lineTotalMinor).toBe(6000);
  });
});
