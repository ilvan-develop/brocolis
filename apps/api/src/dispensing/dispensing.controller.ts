import { Body, Controller, Headers, Param, Post } from "@nestjs/common";
import type { DispensingService } from "./dispensing.service.js";

type DispenseBody = {
  organizationId: string;
  marketCode: string;
};

@Controller("dispensing")
export class DispensingController {
  constructor(private readonly dispensing: DispensingService) {}

  @Post(":orderId")
  dispense(
    @Param("orderId") orderId: string,
    @Headers("x-pharmacist-id") pharmacistId: string,
    @Body() body: DispenseBody,
  ) {
    return this.dispensing.dispenseFromOrder(orderId, pharmacistId, body);
  }
}
