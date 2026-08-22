import { Injectable } from "@nestjs/common";
import type { ApprovalService } from "./approval.service.js";
import type { CreditService } from "./credit.service.js";
import type { PurchaseOrderService } from "./purchase-order.service.js";
import type { QuotationService } from "./quotation.service.js";
import type { RfqService } from "./rfq.service.js";

@Injectable()
export class ProcurementService {
  constructor(
    private readonly rfqService: RfqService,
    private readonly quotationService: QuotationService,
    private readonly poService: PurchaseOrderService,
    private readonly approvalService: ApprovalService,
    readonly _creditService: CreditService,
  ) {}

  createRfq(input: Parameters<RfqService["create"]>[0]) {
    return this.rfqService.create(input);
  }

  listRfqs(input: Parameters<RfqService["listByOrg"]>[0]) {
    return this.rfqService.listByOrg(input);
  }

  getRfq(organizationId: string, marketCode: string, rfqId: string) {
    return this.rfqService.getById(organizationId, marketCode, rfqId);
  }

  submitRfq(rfqId: string) {
    return this.rfqService.advanceStatus(rfqId, "OPEN");
  }

  createQuotation(input: Parameters<QuotationService["create"]>[0]) {
    return this.quotationService.create(input);
  }

  listQuotationsByRfq(
    organizationId: string,
    marketCode: string,
    rfqId: string,
  ) {
    return this.quotationService.listByRfq(organizationId, marketCode, rfqId);
  }

  submitQuotation(quotationId: string) {
    return this.quotationService.advanceStatus(quotationId, "SUBMITTED");
  }

  createPurchaseOrder(input: Parameters<PurchaseOrderService["create"]>[0]) {
    return this.poService.create(input);
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

  submitForApproval(poId: string) {
    return this.poService.advanceStatus(poId, "PENDING_APPROVAL");
  }

  approvePurchaseOrder(approvalId: string, approverId: string) {
    return this.approvalService.decide({
      approvalId,
      decision: "APPROVED",
      approverId,
    });
  }

  rejectPurchaseOrder(approvalId: string, approverId: string, notes?: string) {
    return this.approvalService.decide({
      approvalId,
      decision: "REJECTED",
      approverId,
      ...(notes ? { notes } : {}),
    });
  }
}
