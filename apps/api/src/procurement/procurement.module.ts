import { Module } from "@nestjs/common";
import { ApprovalService } from "./approval.service.js";
import { CreditService } from "./credit.service.js";
import { ProcurementController } from "./procurement.controller.js";
import { ProcurementService } from "./procurement.service.js";
import { PurchaseOrderService } from "./purchase-order.service.js";
import { QuotationService } from "./quotation.service.js";
import { RfqService } from "./rfq.service.js";
import { SupplierService } from "./supplier.service.js";

@Module({
  controllers: [ProcurementController],
  providers: [
    SupplierService,
    RfqService,
    QuotationService,
    PurchaseOrderService,
    ApprovalService,
    CreditService,
    ProcurementService,
  ],
  exports: [
    SupplierService,
    RfqService,
    QuotationService,
    PurchaseOrderService,
    ApprovalService,
    CreditService,
    ProcurementService,
  ],
})
export class ProcurementModule {}
