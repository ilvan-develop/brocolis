import { Module } from "@nestjs/common";
import { CartModule } from "../cart/cart.module.js";
import { OrdersModule } from "../orders/orders.module.js";
import { CheckoutController } from "./checkout.controller.js";
import { CheckoutService } from "./checkout.service.js";

@Module({
  imports: [CartModule, OrdersModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
