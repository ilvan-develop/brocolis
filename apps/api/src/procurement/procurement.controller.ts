import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import type { ProcurementService } from "./procurement.service.js";

type OrgMarketQuery = { organizationId: string; marketCode: string };

@Controller("procurement")
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  // ── Suppliers ──────────────────────────────────────────────────────────

  @Post("supplier")
  createSupplier(
    @Body() body: Parameters<ProcurementService["createSupplier"]>[0],
  ) {
    return this.procurement.createSupplier(body);
  }

  @Get("supplier")
  listSuppliers(@Query() query: OrgMarketQuery) {
    return this.procurement.listSuppliers(query.organizationId, query.marketCode);
  }

  @Get("supplier/:supplierId")
  getSupplier(
    @Param("supplierId") supplierId: string,
    @Query() query: OrgMarketQuery,
  ) {
    return this.procurement.getSupplier(
      query.organizationId,
      query.marketCode,
      supplierId,
    );
  }

  // ── RFQ ────────────────────────────────────────────────────────────────

  @Post("rfq")
  createRfq(@Body() body: Parameters<ProcurementService["createRfq"]>[0]) {
    return this.procurement.createRfq(body);
  }

  @Get("rfq")
  listRfqs(@Query() query: { organizationId: string; marketCode: string }) {
    return this.procurement.listRfqs(query);
  }

  @Get("rfq/:rfqId")
  getRfq(
    @Param("rfqId") rfqId: string,
    @Query() query: OrgMarketQuery,
  ) {
    return this.procurement.getRfq(
      query.organizationId,
      query.marketCode,
      rfqId,
    );
  }

  @Post("rfq/:rfqId/submit")
  submitRfq(
    @Param("rfqId") rfqId: string,
    @Body() body: OrgMarketQuery,
  ) {
    return this.procurement.submitRfq(
      body.organizationId,
      body.marketCode,
      rfqId,
    );
  }

  // ── Quotation ──────────────────────────────────────────────────────────

  @Post("quotation")
  createQuotation(
    @Body() body: Parameters<ProcurementService["createQuotation"]>[0],
  ) {
    return this.procurement.createQuotation(body);
  }

  @Get("rfq/:rfqId/quotations")
  listQuotations(
    @Param("rfqId") rfqId: string,
    @Query() query: OrgMarketQuery,
  ) {
    return this.procurement.listQuotationsByRfq(
      query.organizationId,
      query.marketCode,
      rfqId,
    );
  }

  @Post("quotation/:quotationId/submit")
  submitQuotation(
    @Param("quotationId") quotationId: string,
    @Body() body: OrgMarketQuery,
  ) {
    return this.procurement.submitQuotation(
      body.organizationId,
      body.marketCode,
      quotationId,
    );
  }

  @Post("quotation/:quotationId/accept")
  acceptQuotation(
    @Param("quotationId") quotationId: string,
    @Body() body: OrgMarketQuery,
  ) {
    return this.procurement.acceptQuotation(
      body.organizationId,
      body.marketCode,
      quotationId,
    );
  }

  @Post("quotation/:quotationId/reject")
  rejectQuotation(
    @Param("quotationId") quotationId: string,
    @Body() body: OrgMarketQuery & { notes?: string },
  ) {
    return this.procurement.rejectQuotation(
      body.organizationId,
      body.marketCode,
      quotationId,
      body.notes,
    );
  }

  // ── Purchase Orders ────────────────────────────────────────────────────

  @Post("purchase-order")
  createPurchaseOrder(
    @Body() body: Parameters<ProcurementService["createPurchaseOrder"]>[0],
  ) {
    return this.procurement.createPurchaseOrder(body);
  }

  @Get("purchase-order")
  listPurchaseOrders(
    @Query()
    query: {
      organizationId: string;
      marketCode: string;
      status?: string;
      supplierId?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.procurement.listPurchaseOrders(
      query.organizationId,
      query.marketCode,
      {
        ...(query.status ? { status: query.status } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      },
      query.page !== undefined ? Number(query.page) : undefined,
      query.pageSize !== undefined ? Number(query.pageSize) : undefined,
    );
  }

  @Get("purchase-order/:poId")
  getPurchaseOrder(
    @Param("poId") poId: string,
    @Query() query: OrgMarketQuery,
  ) {
    return this.procurement.getPurchaseOrder(
      query.organizationId,
      query.marketCode,
      poId,
    );
  }

  @Post("purchase-order/:poId/submit")
  submitForApproval(
    @Param("poId") poId: string,
    @Body() body: OrgMarketQuery & { approverIds: string[] },
  ) {
    return this.procurement.submitForApproval(
      body.organizationId,
      body.marketCode,
      poId,
      body.approverIds,
    );
  }

  @Post("purchase-order/:poId/confirm")
  confirmPurchaseOrder(
    @Param("poId") poId: string,
    @Body() body: OrgMarketQuery,
  ) {
    return this.procurement.confirmPurchaseOrder(
      body.organizationId,
      body.marketCode,
      poId,
    );
  }

  @Post("purchase-order/:poId/delivery")
  advancePoDelivery(
    @Param("poId") poId: string,
    @Body()
    body: OrgMarketQuery & { to: "IN_DELIVERY" | "DELIVERED" | "COMPLETED" },
  ) {
    return this.procurement.advancePoDelivery(
      body.organizationId,
      body.marketCode,
      poId,
      body.to,
    );
  }

  @Post("approval/:approvalId/approve")
  approve(
    @Param("approvalId") approvalId: string,
    @Body() body: OrgMarketQuery & { approverId: string },
  ) {
    return this.procurement.decideApproval(
      body.organizationId,
      body.marketCode,
      approvalId,
      "APPROVED",
      body.approverId,
    );
  }

  @Post("approval/:approvalId/reject")
  reject(
    @Param("approvalId") approvalId: string,
    @Body() body: OrgMarketQuery & { approverId: string; notes?: string },
  ) {
    return this.procurement.decideApproval(
      body.organizationId,
      body.marketCode,
      approvalId,
      "REJECTED",
      body.approverId,
      body.notes,
    );
  }

  // ── Crédito ────────────────────────────────────────────────────────────

  @Post("credit-account")
  createCreditAccount(
    @Body() body: Parameters<ProcurementService["createCreditAccount"]>[0],
  ) {
    return this.procurement.createCreditAccount(body);
  }

  @Get("credit-account/:supplierId")
  getCreditAccount(
    @Param("supplierId") supplierId: string,
    @Query() query: { organizationId: string },
  ) {
    return this.procurement.getCreditAccount(query.organizationId, supplierId);
  }

  @Post("credit-account/check")
  checkCredit(
    @Body() body: Parameters<ProcurementService["checkCredit"]>[0],
  ) {
    return this.procurement.checkCredit(body);
  }

  // ── Preços (tiers + volume) ────────────────────────────────────────────

  @Post("pricing/tier")
  createPriceTier(
    @Body() body: Parameters<ProcurementService["createPriceTier"]>[0],
  ) {
    return this.procurement.createPriceTier(body);
  }

  @Post("pricing/volume")
  createVolumePrice(
    @Body() body: Parameters<ProcurementService["createVolumePrice"]>[0],
  ) {
    return this.procurement.createVolumePrice(body);
  }

  @Get("pricing/tier/:supplierId")
  listPriceTiers(
    @Param("supplierId") supplierId: string,
    @Query() query: OrgMarketQuery & { productId?: string },
  ) {
    return this.procurement.listPriceTiers(
      query.organizationId,
      query.marketCode,
      supplierId,
      query.productId,
    );
  }

  @Post("pricing/calculate")
  calculatePrice(
    @Body() body: Parameters<ProcurementService["calculatePrice"]>[0],
  ) {
    return this.procurement.calculatePrice(body);
  }

  // ── Faturação B2B + AGT/SAF-T ─────────────────────────────────────────

  @Post("purchase-order/:poId/invoice")
  issueInvoice(
    @Param("poId") poId: string,
    @Body() body: OrgMarketQuery,
  ) {
    return this.procurement.issueInvoice(
      body.organizationId,
      body.marketCode,
      poId,
    );
  }

  @Get("invoice")
  listInvoices(@Query() query: OrgMarketQuery) {
    return this.procurement.listInvoices(query.organizationId, query.marketCode);
  }

  @Get("invoice/:invoiceId")
  getInvoice(
    @Param("invoiceId") invoiceId: string,
    @Query() query: OrgMarketQuery,
  ) {
    return this.procurement.getInvoice(
      query.organizationId,
      query.marketCode,
      invoiceId,
    );
  }

  @Post("invoice/saft-export")
  requestInvoiceSaftExport(
    @Body()
    body: {
      organizationId: string;
      marketCode: string;
      requestedBy: string;
      periodStart: string;
      periodEnd: string;
    },
  ) {
    return this.procurement.requestInvoiceSaftExport({
      organizationId: body.organizationId,
      marketCode: body.marketCode,
      requestedBy: body.requestedBy,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
    });
  }
}
