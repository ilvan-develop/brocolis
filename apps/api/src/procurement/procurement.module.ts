import { Module } from "@nestjs/common";
import { ComplianceModule } from "../compliance/compliance.module.js";
import { ApprovalService } from "./approval.service.js";
import { CreditService } from "./credit.service.js";
import { InvoiceService } from "./invoice.service.js";
import { PricingService } from "./pricing.service.js";
import { ProcurementController } from "./procurement.controller.js";
import { ProcurementService } from "./procurement.service.js";
import { PurchaseOrderService } from "./purchase-order.service.js";
import { QuotationService } from "./quotation.service.js";
import { RfqService } from "./rfq.service.js";
import { SupplierService } from "./supplier.service.js";

@Module({
  imports: [ComplianceModule],
  controllers: [ProcurementController],
  providers: [
    SupplierService,
    RfqService,
    QuotationService,
    PurchaseOrderService,
    ApprovalService,
    CreditService,
    PricingService,
    InvoiceService,
    ProcurementService,
  ],
  exports: [
    SupplierService,
    RfqService,
    QuotationService,
    PurchaseOrderService,
    ApprovalService,
    CreditService,
    PricingService,
    InvoiceService,
    ProcurementService,
  ],
})
export class ProcurementModule {}
