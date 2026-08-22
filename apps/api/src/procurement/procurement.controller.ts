import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import type { ProcurementService } from "./procurement.service.js";

@Controller("procurement")
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

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
    @Query() query: { organizationId: string; marketCode: string },
  ) {
    return this.procurement.getRfq(
      query.organizationId,
      query.marketCode,
      rfqId,
    );
  }

  @Post("rfq/:rfqId/submit")
  submitRfq(@Param("rfqId") rfqId: string) {
    return this.procurement.submitRfq(rfqId);
  }

  @Post("quotation")
  createQuotation(
    @Body() body: Parameters<ProcurementService["createQuotation"]>[0],
  ) {
    return this.procurement.createQuotation(body);
  }

  @Get("rfq/:rfqId/quotations")
  listQuotations(
    @Param("rfqId") rfqId: string,
    @Query() query: { organizationId: string; marketCode: string },
  ) {
    return this.procurement.listQuotationsByRfq(
      query.organizationId,
      query.marketCode,
      rfqId,
    );
  }

  @Post("quotation/:quotationId/submit")
  submitQuotation(@Param("quotationId") quotationId: string) {
    return this.procurement.submitQuotation(quotationId);
  }

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
    @Query() query: { organizationId: string; marketCode: string },
  ) {
    return this.procurement.getPurchaseOrder(
      query.organizationId,
      query.marketCode,
      poId,
    );
  }

  @Post("purchase-order/:poId/submit")
  submitForApproval(@Param("poId") poId: string) {
    return this.procurement.submitForApproval(poId);
  }

  @Post("approval/:approvalId/approve")
  approve(
    @Param("approvalId") approvalId: string,
    @Body() body: { approverId: string },
  ) {
    return this.procurement.approvePurchaseOrder(approvalId, body.approverId);
  }

  @Post("approval/:approvalId/reject")
  reject(
    @Param("approvalId") approvalId: string,
    @Body() body: { approverId: string; notes?: string },
  ) {
    return this.procurement.rejectPurchaseOrder(
      approvalId,
      body.approverId,
      body.notes,
    );
  }
}
