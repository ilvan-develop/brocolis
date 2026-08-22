import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module.js";
import { SettlementsController } from "./settlements.controller.js";
import { SettlementsService } from "./settlements.service.js";

@Module({
  imports: [OrdersModule],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
