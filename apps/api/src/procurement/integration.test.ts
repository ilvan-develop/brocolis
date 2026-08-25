import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { ComplianceService } from "../compliance/compliance.service.js";
import { ApprovalService } from "./approval.service.js";
import { type CreditAccountRecord, CreditService } from "./credit.service.js";
import { InvoiceService } from "./invoice.service.js";
import { PricingService } from "./pricing.service.js";
import { ProcurementService } from "./procurement.service.js";
import { PurchaseOrderService } from "./purchase-order.service.js";
import { QuotationService } from "./quotation.service.js";
import { RfqService } from "./rfq.service.js";
import { SupplierService } from "./supplier.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const MARKET = "AO";
const SUP = "c1234567890abcdef00000001";
const PROD = "c1234567890abcdef00000021";

function makeServices() {
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

describe("Integration — Procurement full lifecycle with compliance", () => {
  let ctx: ReturnType<typeof makeServices>;

  beforeEach(() => {
    ctx = makeServices();
  });

  it("runs RFQ → Quotation → PO → Approval → Credit → Delivery → Invoice + SAF-T export", async () => {
    const { procurement, complianceService } = ctx;

    const supplier = procurement.createSupplier({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Fornecedor Integração",
      slug: "fornecedor-integracao",
    });

    const rfq = procurement.createRfq({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      subject: "Compra integração",
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
    expect(procurement.getRfq(ORG, MARKET, rfq.id).status).toBe("QUOTED");

    procurement.acceptQuotation(ORG, MARKET, quotation.id);
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

    procurement.decideApproval(
      ORG,
      MARKET,
      approvals[0]?.id ?? "",
      "APPROVED",
      "approver-1",
    );
    procurement.decideApproval(
      ORG,
      MARKET,
      approvals[1]?.id ?? "",
      "APPROVED",
      "approver-2",
    );

    const confirmed = procurement.confirmPurchaseOrder(ORG, MARKET, po.id);
    expect(confirmed.status).toBe("CONFIRMED");
    expect(procurement.getCreditAccount(ORG, supplier.id)?.balanceMinor).toBe(
      500000,
    );

    procurement.advancePoDelivery(ORG, MARKET, po.id, "IN_DELIVERY");
    procurement.advancePoDelivery(ORG, MARKET, po.id, "DELIVERED");
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

    await complianceService.upsertPolicy({
      marketCode: MARKET,
      saftEnabled: true,
    });
    const saftJob = await procurement.requestInvoiceSaftExport({
      organizationId: ORG,
      marketCode: MARKET,
      requestedBy: "finance-user",
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
    });
    expect(saftJob.type).toBe("PURCHASES");
    expect(saftJob.status).toBe("QUEUED");
  });

  it("blocks confirmPurchaseOrder when credit limit is insufficient", async () => {
    const { procurement } = ctx;
    const supplier = procurement.createSupplier({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Fornecedor Crédito",
      slug: "fornecedor-credito",
    });

    const rfq = procurement.createRfq({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      subject: "Teste crédito",
    });
    procurement.submitRfq(ORG, MARKET, rfq.id);

    const quotation = procurement.createQuotation({
      organizationId: ORG,
      marketCode: MARKET,
      rfqId: rfq.id,
      supplierId: supplier.id,
      totalAmountMinor: 900000,
      items: [{ productId: PROD, quantity: 10, unitPriceMinor: 90000 }],
    });
    procurement.submitQuotation(ORG, MARKET, quotation.id);
    procurement.acceptQuotation(ORG, MARKET, quotation.id);

    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      quotationId: quotation.id,
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
      creditLimitMinor: 500000,
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

    expect(() => procurement.confirmPurchaseOrder(ORG, MARKET, po.id)).toThrow(
      BadRequestException,
    );
    expect(procurement.getCreditAccount(ORG, supplier.id)?.balanceMinor).toBe(
      0,
    );
  });

  it("rejecting one approval level rejects the whole PO", async () => {
    const { procurement } = ctx;
    const supplier = procurement.createSupplier({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Fornecedor Rejeição",
      slug: "fornecedor-rejeicao",
    });

    const rfq = procurement.createRfq({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      subject: "Teste rejeição",
    });
    procurement.submitRfq(ORG, MARKET, rfq.id);

    const quotation = procurement.createQuotation({
      organizationId: ORG,
      marketCode: MARKET,
      rfqId: rfq.id,
      supplierId: supplier.id,
      totalAmountMinor: 100000,
      items: [{ productId: PROD, quantity: 10, unitPriceMinor: 10000 }],
    });
    procurement.submitQuotation(ORG, MARKET, quotation.id);
    procurement.acceptQuotation(ORG, MARKET, quotation.id);

    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      quotationId: quotation.id,
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

  it("createPurchaseOrder requires the linked quotation to be ACCEPTED", async () => {
    const { procurement } = ctx;
    const supplier = procurement.createSupplier({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Fornecedor PO",
      slug: "fornecedor-po",
    });

    const rfq = procurement.createRfq({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      subject: "Teste PO",
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

  it("issueInvoice rejects a PO that has not been delivered yet", async () => {
    const { procurement } = ctx;
    const supplier = procurement.createSupplier({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Fornecedor Invoice",
      slug: "fornecedor-invoice",
    });

    const rfq = procurement.createRfq({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      subject: "Teste invoice",
    });
    procurement.submitRfq(ORG, MARKET, rfq.id);

    const quotation = procurement.createQuotation({
      organizationId: ORG,
      marketCode: MARKET,
      rfqId: rfq.id,
      supplierId: supplier.id,
      totalAmountMinor: 100000,
      items: [{ productId: PROD, quantity: 10, unitPriceMinor: 10000 }],
    });
    procurement.submitQuotation(ORG, MARKET, quotation.id);
    procurement.acceptQuotation(ORG, MARKET, quotation.id);

    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      quotationId: quotation.id,
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

  it("decideApproval rejects cross-tenant approval ids with 404", async () => {
    const { procurement } = ctx;
    const supplier = procurement.createSupplier({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Fornecedor Cross",
      slug: "fornecedor-cross",
    });

    const rfq = procurement.createRfq({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      subject: "Teste cross",
    });
    procurement.submitRfq(ORG, MARKET, rfq.id);

    const quotation = procurement.createQuotation({
      organizationId: ORG,
      marketCode: MARKET,
      rfqId: rfq.id,
      supplierId: supplier.id,
      totalAmountMinor: 100000,
      items: [{ productId: PROD, quantity: 10, unitPriceMinor: 10000 }],
    });
    procurement.submitQuotation(ORG, MARKET, quotation.id);
    procurement.acceptQuotation(ORG, MARKET, quotation.id);

    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      quotationId: quotation.id,
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
        "11111111-1111-4111-8111-111111111111",
        MARKET,
        approvals[0]?.id ?? "",
        "APPROVED",
        "approver-1",
      ),
    ).toThrow(NotFoundException);
  });

  it("calculatePrice reuses PricingService through the orchestrator", async () => {
    const { procurement } = ctx;
    const supplier = procurement.createSupplier({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Fornecedor Preço",
      slug: "fornecedor-preco",
    });

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

  it("blocks confirmPurchaseOrder when the PO is not fully approved", async () => {
    const { procurement } = ctx;
    const supplier = procurement.createSupplier({
      organizationId: ORG,
      marketCode: MARKET,
      name: "Fornecedor Aprovação",
      slug: "fornecedor-aprovacao",
    });

    const rfq = procurement.createRfq({
      organizationId: ORG,
      marketCode: MARKET,
      supplierId: supplier.id,
      subject: "Teste aprovação",
    });
    procurement.submitRfq(ORG, MARKET, rfq.id);

    const quotation = procurement.createQuotation({
      organizationId: ORG,
      marketCode: MARKET,
      rfqId: rfq.id,
      supplierId: supplier.id,
      totalAmountMinor: 100000,
      items: [{ productId: PROD, quantity: 10, unitPriceMinor: 10000 }],
    });
    procurement.submitQuotation(ORG, MARKET, quotation.id);
    procurement.acceptQuotation(ORG, MARKET, quotation.id);

    const po = procurement.createPurchaseOrder({
      organizationId: ORG,
      marketCode: MARKET,
      quotationId: quotation.id,
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

    expect(() => procurement.confirmPurchaseOrder(ORG, MARKET, po.id)).toThrow(
      BadRequestException,
    );

    procurement.submitForApproval(ORG, MARKET, po.id, ["approver-1"]);
    expect(() => procurement.confirmPurchaseOrder(ORG, MARKET, po.id)).toThrow(
      BadRequestException,
    );
  });
});
