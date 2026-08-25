import type { SaftExportJob } from "@brocolis/contracts";
import { database } from "@brocolis/db";
import { BadRequestException, Injectable } from "@nestjs/common";
import type { ComplianceService } from "../compliance/compliance.service.js";
import type { ApprovalService } from "./approval.service.js";
import type { CreditService } from "./credit.service.js";
import type { InvoiceService } from "./invoice.service.js";
import type {
  CalculatePriceInput,
  CreatePriceTierInput,
  CreateVolumePriceInput,
  PricingService,
} from "./pricing.service.js";
import type { PurchaseOrderService } from "./purchase-order.service.js";
import type { QuotationService } from "./quotation.service.js";
import type { RfqService } from "./rfq.service.js";
import type { SupplierService } from "./supplier.service.js";

export type AuditLogEntry = {
  organizationId: string;
  marketCode: string;
  actorType: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
};

/**
 * F4 — Orquestrador do fluxo Procurement B2B completo:
 * RFQ → Quotation → PurchaseOrder → ApprovalFlow → Crédito → Invoice.
 *
 * Cada mutação crítica regista um AuditEvent na mesma operação (regra 7,
 * best-effort: o DB pode ainda não estar wired em dev, ver emitAudit).
 * Toda leitura/mutação exige organizationId+marketCode (regra 3).
 */
@Injectable()
export class ProcurementService {
  private readonly auditEvents: AuditLogEntry[] = [];

  constructor(
    private readonly supplierService: SupplierService,
    private readonly rfqService: RfqService,
    private readonly quotationService: QuotationService,
    private readonly poService: PurchaseOrderService,
    private readonly approvalService: ApprovalService,
    private readonly creditService: CreditService,
    private readonly pricingService: PricingService,
    private readonly invoiceService: InvoiceService,
    private readonly complianceService: ComplianceService,
  ) {}

  // ── Suppliers ──────────────────────────────────────────────────────────

  createSupplier(input: Parameters<SupplierService["create"]>[0]) {
    const supplier = this.supplierService.create(input);
    void this.emitAudit({
      organizationId: supplier.organizationId,
      marketCode: supplier.marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.supplier.created",
      resourceType: "supplier",
      resourceId: supplier.id,
      payload: { name: supplier.name },
    });
    return supplier;
  }

  listSuppliers(organizationId: string, marketCode: string) {
    return this.supplierService.listByOrg(organizationId, marketCode);
  }

  getSupplier(organizationId: string, marketCode: string, supplierId: string) {
    return this.supplierService.getById(organizationId, marketCode, supplierId);
  }

  // ── RFQ ────────────────────────────────────────────────────────────────

  createRfq(input: Parameters<RfqService["create"]>[0]) {
    // Garante que o fornecedor pertence ao mesmo tenant (regra 3).
    this.supplierService.getById(
      input.organizationId,
      input.marketCode,
      input.supplierId,
    );
    const rfq = this.rfqService.create(input);
    void this.emitAudit({
      organizationId: rfq.organizationId,
      marketCode: rfq.marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.rfq.created",
      resourceType: "rfq",
      resourceId: rfq.id,
      payload: { subject: rfq.subject, supplierId: rfq.supplierId },
    });
    return rfq;
  }

  listRfqs(input: Parameters<RfqService["listByOrg"]>[0]) {
    return this.rfqService.listByOrg(input);
  }

  getRfq(organizationId: string, marketCode: string, rfqId: string) {
    return this.rfqService.getById(organizationId, marketCode, rfqId);
  }

  submitRfq(organizationId: string, marketCode: string, rfqId: string) {
    const rfq = this.rfqService.advanceStatus(
      organizationId,
      marketCode,
      rfqId,
      "OPEN",
    );
    void this.emitAudit({
      organizationId,
      marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.rfq.submitted",
      resourceType: "rfq",
      resourceId: rfq.id,
      payload: { status: rfq.status },
    });
    return rfq;
  }

  // ── Quotation ──────────────────────────────────────────────────────────

  createQuotation(input: Parameters<QuotationService["create"]>[0]) {
    const rfq = this.rfqService.getById(
      input.organizationId,
      input.marketCode,
      input.rfqId,
    );
    if (rfq.status !== "OPEN" && rfq.status !== "QUOTED") {
      throw new BadRequestException(
        `RFQ ${rfq.id} não está aberta para cotações (estado: ${rfq.status})`,
      );
    }
    const quotation = this.quotationService.create(input);
    void this.emitAudit({
      organizationId: quotation.organizationId,
      marketCode: quotation.marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.quotation.created",
      resourceType: "quotation",
      resourceId: quotation.id,
      payload: {
        rfqId: quotation.rfqId,
        totalAmountMinor: quotation.totalAmountMinor,
      },
    });
    return quotation;
  }

  listQuotationsByRfq(
    organizationId: string,
    marketCode: string,
    rfqId: string,
  ) {
    return this.quotationService.listByRfq(organizationId, marketCode, rfqId);
  }

  submitQuotation(
    organizationId: string,
    marketCode: string,
    quotationId: string,
  ) {
    const quotation = this.quotationService.advanceStatus(
      organizationId,
      marketCode,
      quotationId,
      "SUBMITTED",
    );
    // A RFQ progride para QUOTED assim que a primeira cotação é submetida.
    const rfq = this.rfqService.getById(
      organizationId,
      marketCode,
      quotation.rfqId,
    );
    if (rfq.status === "OPEN") {
      this.rfqService.advanceStatus(
        organizationId,
        marketCode,
        rfq.id,
        "QUOTED",
      );
    }
    void this.emitAudit({
      organizationId,
      marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.quotation.submitted",
      resourceType: "quotation",
      resourceId: quotation.id,
      payload: { rfqId: quotation.rfqId },
    });
    return quotation;
  }

  acceptQuotation(
    organizationId: string,
    marketCode: string,
    quotationId: string,
  ) {
    const quotation = this.quotationService.advanceStatus(
      organizationId,
      marketCode,
      quotationId,
      "ACCEPTED",
    );
    const rfq = this.rfqService.getById(
      organizationId,
      marketCode,
      quotation.rfqId,
    );
    if (rfq.status === "QUOTED") {
      this.rfqService.advanceStatus(
        organizationId,
        marketCode,
        rfq.id,
        "AWARDED",
      );
    }
    void this.emitAudit({
      organizationId,
      marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.quotation.accepted",
      resourceType: "quotation",
      resourceId: quotation.id,
      payload: { rfqId: quotation.rfqId },
    });
    return quotation;
  }

  rejectQuotation(
    organizationId: string,
    marketCode: string,
    quotationId: string,
    notes?: string,
  ) {
    const quotation = this.quotationService.advanceStatus(
      organizationId,
      marketCode,
      quotationId,
      "REJECTED",
    );
    void this.emitAudit({
      organizationId,
      marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.quotation.rejected",
      resourceType: "quotation",
      resourceId: quotation.id,
      payload: notes ? { notes } : {},
    });
    return quotation;
  }

  // ── Purchase Orders ────────────────────────────────────────────────────

  createPurchaseOrder(input: Parameters<PurchaseOrderService["create"]>[0]) {
    if (input.quotationId) {
      const quotation = this.quotationService.getById(
        input.organizationId,
        input.marketCode,
        input.quotationId,
      );
      if (quotation.status !== "ACCEPTED") {
        throw new BadRequestException(
          `PurchaseOrder só pode ser criada a partir de uma cotação ACEITE (estado: ${quotation.status})`,
        );
      }
      if (quotation.supplierId !== input.supplierId) {
        throw new BadRequestException(
          "supplierId não corresponde ao fornecedor da cotação",
        );
      }
    }
    const po = this.poService.create(input);
    void this.emitAudit({
      organizationId: po.organizationId,
      marketCode: po.marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.po.created",
      resourceType: "purchase_order",
      resourceId: po.id,
      payload: {
        totalAmountMinor: po.totalAmountMinor,
        supplierId: po.supplierId,
      },
    });
    return po;
  }

  listPurchaseOrders(
    organizationId: string,
    marketCode: string,
    filters?: { status?: string; supplierId?: string },
    page?: number,
    pageSize?: number,
  ) {
    return this.poService.listByOrg(
      organizationId,
      marketCode,
      filters as Parameters<PurchaseOrderService["listByOrg"]>[2],
      page,
      pageSize,
    );
  }

  getPurchaseOrder(organizationId: string, marketCode: string, poId: string) {
    return this.poService.getById(organizationId, marketCode, poId);
  }

  /** Cria os registos ApprovalWorkflow (um por nível) e move a PO para PENDING_APPROVAL. */
  submitForApproval(
    organizationId: string,
    marketCode: string,
    poId: string,
    approverIds: string[],
  ) {
    const po = this.poService.advanceStatus(
      organizationId,
      marketCode,
      poId,
      "PENDING_APPROVAL",
    );
    const approvals = approverIds.map((approverId, index) =>
      this.approvalService.create(po.id, approverId, index + 1),
    );
    void this.emitAudit({
      organizationId,
      marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.po.submitted_for_approval",
      resourceType: "purchase_order",
      resourceId: po.id,
      payload: { levels: approvals.length },
    });
    return { po, approvals };
  }

  /**
   * Decide uma aprovação. Uma rejeição move a PO para REJECTED de imediato;
   * quando a última aprovação pendente é decidida como APPROVED, a PO
   * avança para APPROVED (ADR-0013: "PO só avança... quando todas as
   * aprovações estão APPROVED").
   */
  decideApproval(
    organizationId: string,
    marketCode: string,
    approvalId: string,
    decision: "APPROVED" | "REJECTED",
    approverId: string,
    notes?: string,
  ) {
    const approval = this.approvalService.getById(approvalId);
    // Resolve a PO pelo tenant informado — cross-tenant resulta em 404,
    // nunca confirma a existência da approval noutra organização.
    const po = this.poService.getById(
      organizationId,
      marketCode,
      approval.purchaseOrderId,
    );
    const decided = this.approvalService.decide({
      approvalId,
      decision,
      approverId,
      ...(notes ? { notes } : {}),
    });
    void this.emitAudit({
      organizationId,
      marketCode,
      actorType: "user",
      actorId: approverId,
      action: "procurement.approval.decided",
      resourceType: "approval_workflow",
      resourceId: decided.id,
      payload: { decision, purchaseOrderId: po.id, level: decided.level },
    });

    if (decision === "REJECTED") {
      const rejected = this.poService.advanceStatus(
        organizationId,
        marketCode,
        po.id,
        "REJECTED",
      );
      void this.emitAudit({
        organizationId,
        marketCode,
        actorType: "system",
        actorId: "procurement-service",
        action: "procurement.po.rejected",
        resourceType: "purchase_order",
        resourceId: rejected.id,
        payload: { approvalId: decided.id },
      });
    } else if (this.approvalService.hasApproval(po.id)) {
      const approved = this.poService.advanceStatus(
        organizationId,
        marketCode,
        po.id,
        "APPROVED",
      );
      void this.emitAudit({
        organizationId,
        marketCode,
        actorType: "system",
        actorId: "procurement-service",
        action: "procurement.po.approved",
        resourceType: "purchase_order",
        resourceId: approved.id,
        payload: {},
      });
    }
    return decided;
  }

  /**
   * Antes de confirmar a PO: exige aprovação completa e disponibilidade de
   * crédito (ADR-0013). Débito automático do CreditAccount ao confirmar.
   */
  confirmPurchaseOrder(
    organizationId: string,
    marketCode: string,
    poId: string,
  ) {
    const po = this.poService.getById(organizationId, marketCode, poId);
    if (po.status !== "APPROVED") {
      throw new BadRequestException(
        `PurchaseOrder ${poId} precisa estar APPROVED para confirmar (estado: ${po.status})`,
      );
    }
    if (!this.approvalService.hasApproval(poId)) {
      throw new BadRequestException(
        `PurchaseOrder ${poId} tem aprovações pendentes`,
      );
    }
    const creditCheck = this.creditService.check({
      organizationId,
      marketCode,
      supplierId: po.supplierId,
      amountMinor: po.totalAmountMinor,
    });
    if (!creditCheck.available) {
      throw new BadRequestException(
        `Limite de crédito insuficiente para confirmar a PurchaseOrder ${poId}`,
      );
    }
    this.creditService.debit(
      organizationId,
      po.supplierId,
      po.totalAmountMinor,
    );
    const confirmed = this.poService.advanceStatus(
      organizationId,
      marketCode,
      poId,
      "CONFIRMED",
    );
    void this.emitAudit({
      organizationId,
      marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.po.confirmed",
      resourceType: "purchase_order",
      resourceId: confirmed.id,
      payload: { debitedMinor: po.totalAmountMinor },
    });
    return confirmed;
  }

  /**
   * Avança a PO pela logística de entrega. Ao chegar a DELIVERED, o valor
   * é creditado de volta ao CreditAccount (ADR-0013: "crédito ao entregar").
   */
  advancePoDelivery(
    organizationId: string,
    marketCode: string,
    poId: string,
    to: "IN_DELIVERY" | "DELIVERED" | "COMPLETED",
  ) {
    const before = this.poService.getById(organizationId, marketCode, poId);
    const updated = this.poService.advanceStatus(
      organizationId,
      marketCode,
      poId,
      to,
    );
    if (to === "DELIVERED") {
      this.creditService.credit(
        organizationId,
        before.supplierId,
        before.totalAmountMinor,
      );
      void this.emitAudit({
        organizationId,
        marketCode,
        actorType: "system",
        actorId: "procurement-service",
        action: "procurement.credit.released",
        resourceType: "credit_account",
        resourceId: before.supplierId,
        payload: { amountMinor: before.totalAmountMinor },
      });
    }
    void this.emitAudit({
      organizationId,
      marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.po.status_changed",
      resourceType: "purchase_order",
      resourceId: updated.id,
      payload: { from: before.status, to },
    });
    return updated;
  }

  // ── Crédito ────────────────────────────────────────────────────────────

  createCreditAccount(input: Parameters<CreditService["create"]>[0]) {
    this.supplierService.getById(
      input.organizationId,
      input.marketCode,
      input.supplierId,
    );
    const account = this.creditService.create(input);
    void this.emitAudit({
      organizationId: account.organizationId,
      marketCode: account.marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.credit.account_created",
      resourceType: "credit_account",
      resourceId: account.id,
      payload: { creditLimitMinor: account.creditLimitMinor },
    });
    return account;
  }

  checkCredit(input: Parameters<CreditService["check"]>[0]) {
    return this.creditService.check(input);
  }

  getCreditAccount(organizationId: string, supplierId: string) {
    return this.creditService.getAccount(organizationId, supplierId);
  }

  // ── Preços (PriceTier / VolumePrice) ──────────────────────────────────

  createPriceTier(input: CreatePriceTierInput) {
    return this.pricingService.createPriceTier(input);
  }

  createVolumePrice(input: CreateVolumePriceInput) {
    return this.pricingService.createVolumePrice(input);
  }

  listPriceTiers(
    organizationId: string,
    marketCode: string,
    supplierId: string,
    productId?: string,
  ) {
    return this.pricingService.listPriceTiers(
      organizationId,
      marketCode,
      supplierId,
      productId,
    );
  }

  calculatePrice(input: CalculatePriceInput) {
    return this.pricingService.calculatePrice(input);
  }

  // ── Faturação B2B + AGT/SAF-T ─────────────────────────────────────────

  issueInvoice(
    organizationId: string,
    marketCode: string,
    purchaseOrderId: string,
  ) {
    const po = this.poService.getById(
      organizationId,
      marketCode,
      purchaseOrderId,
    );
    const invoice = this.invoiceService.issue(organizationId, marketCode, po);
    void this.emitAudit({
      organizationId,
      marketCode,
      actorType: "user",
      actorId: "procurement-service",
      action: "procurement.invoice.issued",
      resourceType: "invoice",
      resourceId: invoice.id,
      payload: {
        purchaseOrderId,
        totalAmountMinor: invoice.totalAmountMinor,
        invoiceNumber: invoice.invoiceNumber,
      },
    });
    return invoice;
  }

  getInvoice(organizationId: string, marketCode: string, invoiceId: string) {
    return this.invoiceService.getById(organizationId, marketCode, invoiceId);
  }

  listInvoices(organizationId: string, marketCode: string) {
    return this.invoiceService.listByOrg(organizationId, marketCode);
  }

  /** Delega o export AGT/SAF-T ao ComplianceService (type="PURCHASES"). */
  async requestInvoiceSaftExport(input: {
    organizationId: string;
    marketCode: string;
    requestedBy: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<SaftExportJob> {
    return this.complianceService.requestSaftExport({
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      type: "PURCHASES",
      requestedBy: input.requestedBy,
    });
  }

  // ── Auditoria ──────────────────────────────────────────────────────────

  getAuditEvents(): readonly AuditLogEntry[] {
    return this.auditEvents;
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    this.auditEvents.push(entry);
    try {
      const db = await database();
      await db.auditEvent.create({
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: entry.actorType,
        actorId: entry.actorId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        payload: entry.payload,
      } as never);
    } catch {
      // DB ainda não wired — auditoria fica registada em memória.
    }
  }
}
