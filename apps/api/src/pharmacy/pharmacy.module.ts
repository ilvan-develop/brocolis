import { Module } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module.js";
import { OrdersModule } from "../orders/orders.module.js";
import { PaymentsModule } from "../payments/payments.module.js";
import { PharmacyController } from "./pharmacy.controller.js";
import { PharmacyService } from "./pharmacy.service.js";

@Module({
  imports: [OrdersModule, PaymentsModule, InventoryModule],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
