import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import type { ComplianceService } from "./compliance.service.js";

type RawQuery = Record<string, string | undefined>;

function coerceExplorerQuery(query: RawQuery): Record<string, unknown> {
  return {
    organizationId: query.organizationId,
    marketCode: query.marketCode,
    subjectType: query.subjectType,
    subjectId: query.subjectId,
    action: query.action,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
  };
}

function coerceSaftBody(body: unknown): Record<string, unknown> {
  const raw = (body ?? {}) as Record<string, unknown>;
  return {
    ...raw,
    periodStart:
      typeof raw.periodStart === "string"
        ? new Date(raw.periodStart)
        : raw.periodStart,
    periodEnd:
      typeof raw.periodEnd === "string"
        ? new Date(raw.periodEnd)
        : raw.periodEnd,
  };
}

@Controller("compliance")
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get("policies")
  listPolicies() {
    return this.compliance.listPolicies();
  }

  @Get("policies/:marketCode")
  getPolicy(@Param("marketCode") marketCode: string) {
    return this.compliance.getPolicy(marketCode);
  }

  @Put("policies/:marketCode")
  upsertPolicy(@Param("marketCode") marketCode: string, @Body() body: unknown) {
    return this.compliance.upsertPolicy({
      ...(body as Record<string, unknown>),
      marketCode,
    });
  }

  @Post("decisions")
  recordDecision(@Body() body: unknown) {
    return this.compliance.recordDecision(body);
  }

  @Get("decisions")
  listDecisions(@Query() query: RawQuery) {
    return this.compliance.listDecisions(coerceExplorerQuery(query));
  }

  @Post("saft-exports")
  requestSaftExport(@Body() body: unknown) {
    return this.compliance.requestSaftExport(coerceSaftBody(body));
  }

  @Get("saft-exports")
  listSaftExports(@Query() query: RawQuery) {
    return this.compliance.listSaftExports(
      query.organizationId ?? "",
      query.marketCode ?? "",
    );
  }

  @Get("saft-exports/:jobId")
  getSaftExport(@Param("jobId") jobId: string, @Query() query: RawQuery) {
    return this.compliance.getSaftExport(
      query.organizationId ?? "",
      query.marketCode ?? "",
      jobId,
    );
  }

  @Get("audit")
  queryAudit(@Query() query: RawQuery) {
    return this.compliance.queryAudit(coerceExplorerQuery(query));
  }
}
