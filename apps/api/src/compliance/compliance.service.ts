import {
  type AuditExplorerEntry,
  type AuditExplorerQuery,
  auditExplorerQuerySchema,
  type ComplianceDecision,
  policyForMarket,
  type RegulatoryPolicy,
  recordComplianceDecisionInputSchema,
  regulatoryPolicySchema,
  requestSaftExportInputSchema,
  type SaftExportJob,
} from "@brocolis/contracts";
import { database } from "@brocolis/db";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";

export type AuditLogEntry = {
  organizationId: string;
  marketCode: string;
  actorType: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
};

/** Org sintética para mutações ao nível da plataforma (policies por mercado). */
export const PLATFORM_ORG = "00000000-0000-4000-8000-000000000000";

/**
 * F6 — compliance regulatório: policies por mercado (Build Global, Configure
 * Local — zero `if (country === ...)`), decisões sempre auditadas, pedidos de
 * exportação SAF-T (estrutura mock) e explorer do AuditEvent.
 */
@Injectable()
export class ComplianceService {
  private readonly policies = new Map<string, RegulatoryPolicy>();
  private readonly decisions = new Map<string, ComplianceDecision>();
  private readonly saftJobs = new Map<string, SaftExportJob>();
  private readonly auditLog: AuditExplorerEntry[] = [];

  upsertPolicy(input: unknown): RegulatoryPolicy {
    const parsed = regulatoryPolicySchema.parse(input);
    const record: RegulatoryPolicy = { ...parsed };
    this.policies.set(record.marketCode, record);
    void this.emitAudit({
      organizationId: PLATFORM_ORG,
      marketCode: record.marketCode,
      actorType: "platform_admin",
      actorId: "compliance-service",
      action: "compliance.policy.upserted",
      resourceType: "regulatory_policy",
      resourceId: record.marketCode,
      payload: {
        saftEnabled: record.saftEnabled,
        maxPrescriptionDaysValid: record.maxPrescriptionDaysValid,
        controlledSubstances: record.controlledSubstances.length,
      },
    });
    return record;
  }

  getPolicy(marketCode: string): RegulatoryPolicy {
    return this.policyForMarketOrDefault(marketCode);
  }

  /** Fallback seguro — mercado sem policy explícita fica com defaults. */
  policyForMarketOrDefault(marketCode: string): RegulatoryPolicy {
    return (
      this.policies.get(marketCode.trim().toUpperCase()) ??
      policyForMarket(marketCode, [])
    );
  }

  listPolicies(): RegulatoryPolicy[] {
    return [...this.policies.values()];
  }

  recordDecision(input: unknown): ComplianceDecision {
    const parsed = recordComplianceDecisionInputSchema.parse(input);
    const now = new Date();
    const record: ComplianceDecision = {
      id: nextCuid(),
      subjectType: parsed.subjectType,
      subjectId: parsed.subjectId,
      decision: parsed.decision,
      reason: parsed.reason,
      decidedBy: parsed.decidedBy,
      decidedAt: now,
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
    };
    this.decisions.set(record.id, record);
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      actorType: "user",
      actorId: parsed.decidedBy,
      action: "compliance.decision.recorded",
      resourceType: parsed.subjectType,
      resourceId: parsed.subjectId,
      payload: { decision: parsed.decision, reason: parsed.reason },
    });
    return record;
  }

  getDecision(
    organizationId: string,
    marketCode: string,
    decisionId: string,
  ): ComplianceDecision {
    const record = this.decisions.get(decisionId);
    if (
      !record ||
      record.organizationId !== organizationId ||
      record.marketCode !== marketCode
    ) {
      throw new NotFoundException(`Decisão ${decisionId} não encontrada`);
    }
    return record;
  }

  listDecisions(query: unknown): ComplianceDecision[] {
    const parsed = auditExplorerQuerySchema.parse(query);
    return [...this.decisions.values()].filter((decision) =>
      matchesExplorerFilters(
        {
          organizationId: decision.organizationId,
          marketCode: decision.marketCode,
          resourceType: decision.subjectType,
          resourceId: decision.subjectId,
          at: decision.decidedAt,
        },
        parsed,
      ),
    );
  }

  requestSaftExport(input: unknown): SaftExportJob {
    const parsed = requestSaftExportInputSchema.parse(input);
    const policy = this.policyForMarketOrDefault(parsed.marketCode);
    if (!policy.saftEnabled) {
      throw new BadRequestException(
        `SAF-T não está ativado para o mercado ${parsed.marketCode}`,
      );
    }
    const now = new Date();
    const job: SaftExportJob = {
      id: nextCuid(),
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      type: parsed.type,
      status: "QUEUED",
      requestedBy: parsed.requestedBy,
      createdAt: now,
      updatedAt: now,
    };
    this.saftJobs.set(job.id, job);
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      actorType: "user",
      actorId: parsed.requestedBy,
      action: "compliance.saft.export_requested",
      resourceType: "saft_export_job",
      resourceId: job.id,
      payload: {
        periodStart: parsed.periodStart.toISOString(),
        periodEnd: parsed.periodEnd.toISOString(),
        type: parsed.type,
      },
    });
    return job;
  }

  getSaftExport(
    organizationId: string,
    marketCode: string,
    jobId: string,
  ): SaftExportJob {
    const job = this.saftJobs.get(jobId);
    if (
      !job ||
      job.organizationId !== organizationId ||
      job.marketCode !== marketCode
    ) {
      throw new NotFoundException(`Job SAF-T ${jobId} não encontrado`);
    }
    return job;
  }

  listSaftExports(organizationId: string, marketCode: string): SaftExportJob[] {
    return [...this.saftJobs.values()].filter(
      (job) =>
        job.organizationId === organizationId && job.marketCode === marketCode,
    );
  }

  queryAudit(query: unknown): AuditExplorerEntry[] {
    const parsed = auditExplorerQuerySchema.parse(query);
    return this.auditLog.filter((entry) =>
      matchesExplorerFilters(entry, parsed),
    );
  }

  getAuditEvents(): readonly AuditLogEntry[] {
    return this.auditLog.map((entry) => ({
      organizationId: entry.organizationId,
      marketCode: entry.marketCode,
      actorType: entry.actorType,
      actorId: entry.actorId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      payload: entry.payload,
    }));
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    this.auditLog.push({
      id: nextCuid(),
      organizationId: entry.organizationId,
      marketCode: entry.marketCode,
      actorType: entry.actorType,
      actorId: entry.actorId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      payload: entry.payload,
      at: new Date(),
    });
    try {
      const db = await database();
      await db.auditEvent.create({
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: entry.actorType,
        actorId: entry.actorId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        payload: entry.payload,
      } as never);
    } catch {
      // DB ainda não wired — auditoria fica registada em memória.
    }
  }
}

type ExplorerFilterFields = {
  organizationId: string;
  marketCode: string;
  resourceType: string;
  resourceId: string;
  at: Date;
  action?: string;
};

function matchesExplorerFilters(
  fields: ExplorerFilterFields,
  query: AuditExplorerQuery,
): boolean {
  if (fields.organizationId !== query.organizationId) {
    return false;
  }
  if (fields.marketCode !== query.marketCode) {
    return false;
  }
  if (query.subjectType && fields.resourceType !== query.subjectType) {
    return false;
  }
  if (query.subjectId && fields.resourceId !== query.subjectId) {
    return false;
  }
  if (query.action && fields.action !== query.action) {
    return false;
  }
  if (query.from && fields.at.getTime() < query.from.getTime()) {
    return false;
  }
  if (query.to && fields.at.getTime() > query.to.getTime()) {
    return false;
  }
  return true;
}
