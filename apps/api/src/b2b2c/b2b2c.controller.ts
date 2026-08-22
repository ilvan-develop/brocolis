import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import type { B2b2cService } from "./b2b2c.service.js";

type RawQuery = Record<string, string | undefined>;

@Controller("b2b2c")
export class B2b2cController {
  constructor(private readonly b2b2c: B2b2cService) {}

  @Post("orders")
  createOrder(@Body() body: unknown) {
    return this.b2b2c.createOrder(body);
  }

  @Get("orders")
  listOrders(@Query() query: RawQuery) {
    return this.b2b2c.listOrders({
      organizationId: query.organizationId,
      marketCode: query.marketCode,
      pharmacyId: query.pharmacyId,
      stage: query.stage,
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 20,
    });
  }

  @Get("orders/:orderId")
  getOrder(@Param("orderId") orderId: string, @Query() query: RawQuery) {
    return this.b2b2c.getOrder({
      organizationId: query.organizationId,
      marketCode: query.marketCode,
      orderId,
    });
  }

  @Post("orders/:orderId/confirm")
  confirmPharmacy(@Param("orderId") orderId: string, @Body() body: unknown) {
    return this.b2b2c.confirmPharmacy({
      ...(body as Record<string, unknown>),
      orderId,
    });
  }

  @Post("orders/:orderId/pull")
  pullFromSupplier(@Param("orderId") orderId: string, @Body() body: unknown) {
    return this.b2b2c.pullFromSupplier({
      ...(body as Record<string, unknown>),
      orderId,
    });
  }

  @Post("orders/:orderId/deliver")
  markDelivered(@Param("orderId") orderId: string, @Body() body: unknown) {
    return this.b2b2c.markDelivered({
      ...(body as Record<string, unknown>),
      orderId,
    });
  }

  @Get("orders/:orderId/timeline")
  getTimeline(@Param("orderId") orderId: string, @Query() query: RawQuery) {
    return this.b2b2c.getTimeline({
      organizationId: query.organizationId,
      marketCode: query.marketCode,
      orderId,
    });
  }
}
