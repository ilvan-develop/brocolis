import type { ListOrdersInput } from "@brocolis/contracts";
import { Controller, Get, Param, Query } from "@nestjs/common";
import type { OrdersService } from "./orders.service.js";

type RawQuery = Record<string, string | undefined>;

function coerceListQuery(query: RawQuery): Record<string, unknown> {
  return {
    ...query,
    page: query.page !== undefined ? Number(query.page) : undefined,
    pageSize: query.pageSize !== undefined ? Number(query.pageSize) : undefined,
  };
}

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() query: RawQuery) {
    const input: ListOrdersInput = coerceListQuery(query) as ListOrdersInput;
    return this.orders.listByOrg(input);
  }

  @Get(":orderId")
  detail(@Param("orderId") orderId: string, @Query() query: RawQuery) {
    return this.orders.getOrder({
      orderId,
      organizationId: query.organizationId,
      marketCode: query.marketCode,
    });
  }
}
