import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import type { InventoryService } from "./inventory.service.js";

type RawQuery = Record<string, string | undefined>;

function coerceListQuery(query: RawQuery): Record<string, unknown> {
  return {
    ...query,
    limit: query.limit !== undefined ? Number(query.limit) : undefined,
  };
}

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post("batches")
  receiveBatch(@Body() body: unknown) {
    return this.inventory.receiveBatch(body);
  }

  @Post("adjust")
  adjustStock(@Body() body: unknown) {
    return this.inventory.adjustStock(body);
  }

  @Get()
  list(@Query() query: RawQuery) {
    return this.inventory.listByItem(coerceListQuery(query));
  }

  @Patch("reorder-point")
  updateReorderPoint(@Body() body: unknown) {
    return this.inventory.updateReorderPoint(body);
  }
}
