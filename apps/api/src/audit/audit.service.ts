import {
  type AuditExplorerEntry,
  auditExplorerQuerySchema,
} from "@brocolis/contracts";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AuditService {
  private readonly events: AuditExplorerEntry[] = [];

  record(entry: Omit<AuditExplorerEntry, "id" | "at">): void {
    this.events.push({
      ...entry,
      id: `c${Date.now().toString(36).padStart(12, "0")}`,
      at: new Date(),
    });
  }

  query(raw: unknown): AuditExplorerEntry[] {
    const parsed = auditExplorerQuerySchema.parse(raw);
    return this.events.filter((e) => {
      if (e.organizationId !== parsed.organizationId) return false;
      if (e.marketCode !== parsed.marketCode) return false;
      if (parsed.subjectType && e.actorType !== parsed.subjectType)
        return false;
      if (parsed.subjectId && e.resourceId !== parsed.subjectId) return false;
      if (parsed.action && e.action !== parsed.action) return false;
      if (parsed.from && e.at.getTime() < parsed.from.getTime()) return false;
      if (parsed.to && e.at.getTime() > parsed.to.getTime()) return false;
      return true;
    });
  }

  listAll(organizationId: string, marketCode: string): AuditExplorerEntry[] {
    return this.events.filter(
      (e) => e.organizationId === organizationId && e.marketCode === marketCode,
    );
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
