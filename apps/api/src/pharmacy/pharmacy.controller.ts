import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import type { PharmacyService } from "./pharmacy.service.js";

type RawQuery = Record<string, string | undefined>;

type RefundBody = {
  orderId?: string;
  [key: string]: unknown;
};

@Controller("pharmacy")
export class PharmacyController {
  constructor(private readonly pharmacy: PharmacyService) {}

  @Post("register")
  register(@Body() body: unknown) {
    return this.pharmacy.registerPharmacy(body as never);
  }

  @Post("verify")
  verify(@Body() body: unknown) {
    return this.pharmacy.verifyPharmacy(body);
  }

  @Get("pharmacists")
  listPharmacists(@Query() query: RawQuery) {
    return this.pharmacy.listPharmacistsByOrg(
      query.organizationId ?? "",
      query.marketCode,
    );
  }

  @Post("refunds")
  refund(@Body() body: unknown) {
    const { orderId, ...rest } = (body ?? {}) as RefundBody;
    return this.pharmacy.refundOrder(orderId ?? "", rest);
  }
}
