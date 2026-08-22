import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import type { SettlementsService } from "./settlements.service.js";

type RawQuery = Record<string, string | undefined>;

function coerceComputeQuery(query: RawQuery): Record<string, unknown> {
  return {
    ...query,
    periodStart: query.periodStart ? new Date(query.periodStart) : undefined,
    periodEnd: query.periodEnd ? new Date(query.periodEnd) : undefined,
  };
}

@Controller("settlements")
export class SettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Get("compute")
  compute(@Query() query: RawQuery) {
    return this.settlements.computeSettlement(coerceComputeQuery(query));
  }

  @Post()
  create(@Body() body: unknown) {
    return this.settlements.createSettlement(body);
  }
}
