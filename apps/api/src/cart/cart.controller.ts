import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Patch,
  Post,
} from "@nestjs/common";
import type { CartService } from "./cart.service.js";

@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@Headers("x-session-id") sessionId: string, @Body() body: unknown) {
    return this.cart.get(sessionId, body);
  }

  @Post("items")
  add(@Headers("x-session-id") sessionId: string, @Body() body: unknown) {
    return this.cart.add(sessionId, body);
  }

  @Patch("items")
  update(@Headers("x-session-id") sessionId: string, @Body() body: unknown) {
    return this.cart.update(sessionId, body);
  }

  @Delete("items")
  remove(@Headers("x-session-id") sessionId: string, @Body() body: unknown) {
    return this.cart.remove(sessionId, body);
  }
}
