import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CatalogService } from "../catalog/catalog.service.js";
import { CartService } from "./cart.service.js";

@Controller("cart")
export class CartController {
  private readonly cart: CartService;

  constructor() {
    this.cart = new CartService(new CatalogService());
  }

  @Get()
  get(
    @Headers("x-session-id") sessionId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.cart.get(sessionId, query);
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
