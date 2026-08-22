import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module.js";
import { FinpayWebhookController } from "./finpay-webhook.controller.js";
import { PaymentsController } from "./payments.controller.js";
import { PaymentsService } from "./payments.service.js";

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController, FinpayWebhookController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
