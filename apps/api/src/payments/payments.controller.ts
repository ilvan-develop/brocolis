import { Body, Controller, Post } from "@nestjs/common";
import type { PaymentsService } from "./payments.service.js";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  create(@Body() body: unknown) {
    return this.payments.createPayment(body);
  }
}
