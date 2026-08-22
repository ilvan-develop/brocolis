import { Controller, Get, Header, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import type { AuditService } from "./audit.service.js";

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

@Controller("audit")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get("events")
  queryEvents(@Query() query: RawQuery) {
    return this.audit.query(coerceExplorerQuery(query));
  }

  @Get("events/export")
  @Header("Content-Type", "text/csv")
  exportCsv(@Query() query: RawQuery, @Res() res: Response) {
    const entries = this.audit.query(coerceExplorerQuery(query));
    const csv = this.audit.exportCsv(entries);
    res.send(csv);
  }
}
