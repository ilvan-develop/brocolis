import {
  type AuditExplorerEntry,
  auditExplorerQuerySchema,
} from "@brocolis/contracts";
import { Injectable, Optional } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class AuditService {
  constructor(
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async record(entry: Omit<AuditExplorerEntry, "id" | "at">): Promise<void> {
    if (!this.prisma) {
      return;
    }
    await (this.prisma as any).auditEvent.create({
      data: {
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: entry.actorType,
        actorId: entry.actorId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        payload: entry.payload as unknown as Record<string, unknown>,
      },
    });
  }

  async query(raw: unknown): Promise<AuditExplorerEntry[]> {
    const parsed = auditExplorerQuerySchema.parse(raw);
    if (!this.prisma) {
      return [];
    }
    const events = await (this.prisma as any).auditEvent.findMany({
      where: {
        organizationId: parsed.organizationId,
        marketCode: parsed.marketCode,
        ...(parsed.subjectType && { actorType: parsed.subjectType }),
        ...(parsed.subjectId && { resourceId: parsed.subjectId }),
        ...(parsed.action && { action: parsed.action }),
        ...(parsed.from && { createdAt: { gte: new Date(parsed.from) } }),
        ...(parsed.to && { createdAt: { lte: new Date(parsed.to) } }),
      },
      orderBy: { createdAt: "desc" },
    });

    return events.map((e: any) => ({
      id: e.id,
      organizationId: e.organizationId,
      marketCode: e.marketCode,
      actorType: e.actorType,
      actorId: e.actorId,
      action: e.action,
      resourceType: e.resourceType,
      resourceId: e.resourceId,
      payload: e.payload as Record<string, unknown> | undefined,
      at: e.createdAt,
    }));
  }

  async listAll(
    organizationId: string,
    marketCode: string,
  ): Promise<AuditExplorerEntry[]> {
    if (!this.prisma) {
      return [];
    }
    const events = await (this.prisma as any).auditEvent.findMany({
      where: { organizationId, marketCode },
      orderBy: { createdAt: "desc" },
    });

    return events.map((e: any) => ({
      id: e.id,
      organizationId: e.organizationId,
      marketCode: e.marketCode,
      actorType: e.actorType,
      actorId: e.actorId,
      action: e.action,
      resourceType: e.resourceType,
      resourceId: e.resourceId,
      payload: e.payload as Record<string, unknown> | undefined,
      at: e.createdAt,
    }));
  }

  exportCsv(entries: AuditExplorerEntry[]): string {
    const header =
      "id,organizationId,marketCode,actorType,actorId,action,resourceType,resourceId,at";
    const rows = entries.map(
      (e) =>
        `${e.id},${e.organizationId},${e.marketCode},${e.actorType},${e.actorId},${e.action},${e.resourceType},${e.resourceId},${e.at.toISOString()}`,
    );
    return [header, ...rows].join("\n");
  }
}
