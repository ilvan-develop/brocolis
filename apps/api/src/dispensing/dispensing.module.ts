import { Module } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module.js";
import { OrdersModule } from "../orders/orders.module.js";
import { PaymentsModule } from "../payments/payments.module.js";
import { DispensingController } from "./dispensing.controller.js";
import { DispensingService } from "./dispensing.service.js";
import { PrescriptionController } from "./prescription.controller.js";
import { PrescriptionService } from "./prescription.service.js";

@Module({
  imports: [OrdersModule, PaymentsModule, InventoryModule],
  controllers: [DispensingController, PrescriptionController],
  providers: [DispensingService, PrescriptionService],
  exports: [DispensingService, PrescriptionService],
})
export class DispensingModule {}
