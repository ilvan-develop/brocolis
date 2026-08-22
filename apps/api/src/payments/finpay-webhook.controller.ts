import { Body, Controller, Post } from "@nestjs/common";
import type { PaymentsService } from "./payments.service.js";

@Controller("finpay")
export class FinpayWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("webhook")
  webhook(@Body() body: unknown) {
    return this.payments.handleWebhook(body);
  }
}
