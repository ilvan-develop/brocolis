import { Body, Controller, Headers, Post } from "@nestjs/common";
import type { CheckoutService } from "./checkout.service.js";

@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  checkout(
    @Headers("x-session-id") sessionId: string,
    @Body()
    body: {
      organizationId: string;
      marketCode: string;
      customerId?: string;
      deliveryAddress?: {
        zone?: string;
        addressLine: string;
        city?: string;
        referencePoint?: string;
      };
      idempotencyKey?: string;
    },
  ) {
    const cart = this.requireCartService().get(sessionId, {
      organizationId: body.organizationId,
      marketCode: body.marketCode,
    });
    return this.checkoutService.createOrder(cart, body);
  }

  private requireCartService() {
    return (
      this.checkoutService as unknown as {
        cart: import("../cart/cart.service.js").CartService;
      }
    ).cart;
  }
}
