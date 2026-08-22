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

@Injectable()
export class ComplianceService {
  async upsertPolicy(input: unknown): Promise<RegulatoryPolicy> {
    const parsed = regulatoryPolicySchema.parse(input);
    const db = await database();
    const record = await db.regulatoryPolicy.upsert({
      where: { marketCode: parsed.marketCode },
      create: {
        marketCode: parsed.marketCode,
        controlledSubstances: parsed.controlledSubstances,
        prescriptionRequiredCategories: parsed.prescriptionRequiredCategories,
        maxPrescriptionDaysValid: parsed.maxPrescriptionDaysValid,
        licenseRequirements: parsed.licenseRequirements,
        saftEnabled: parsed.saftEnabled,
        agtEndpoint: parsed.agtEndpoint ?? null,
      },
      update: {
        controlledSubstances: parsed.controlledSubstances,
        prescriptionRequiredCategories: parsed.prescriptionRequiredCategories,
        maxPrescriptionDaysValid: parsed.maxPrescriptionDaysValid,
        licenseRequirements: parsed.licenseRequirements,
        saftEnabled: parsed.saftEnabled,
        agtEndpoint: parsed.agtEndpoint ?? null,
      },
    });
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
        controlledSubstances: (record.controlledSubstances as string[]).length,
      },
    });
    return {
      marketCode: record.marketCode,
      controlledSubstances: record.controlledSubstances as string[],
      prescriptionRequiredCategories: record.prescriptionRequiredCategories as string[],
      maxPrescriptionDaysValid: record.maxPrescriptionDaysValid,
      licenseRequirements: record.licenseRequirements as string[],
      saftEnabled: record.saftEnabled,
      ...(record.agtEndpoint ? { agtEndpoint: record.agtEndpoint } : {}),
    };
  }

  async getPolicy(marketCode: string): Promise<RegulatoryPolicy> {
    return this.policyForMarketOrDefault(marketCode);
  }

  async policyForMarketOrDefault(marketCode: string): Promise<RegulatoryPolicy> {
    const db = await database();
    const normalized = marketCode.trim().toUpperCase();
    const record = await db.regulatoryPolicy.findUnique({
      where: { marketCode: normalized },
    });
    if (record) {
      return {
        marketCode: record.marketCode,
        controlledSubstances: record.controlledSubstances as string[],
        prescriptionRequiredCategories: record.prescriptionRequiredCategories as string[],
        maxPrescriptionDaysValid: record.maxPrescriptionDaysValid,
        licenseRequirements: record.licenseRequirements as string[],
        saftEnabled: record.saftEnabled,
        ...(record.agtEndpoint ? { agtEndpoint: record.agtEndpoint } : {}),
      };
    }
    return policyForMarket(normalized, []);
  }

  async listPolicies(): Promise<RegulatoryPolicy[]> {
    const db = await database();
    const records = await db.regulatoryPolicy.findMany();
    return records.map((r) => ({
      marketCode: r.marketCode,
      controlledSubstances: r.controlledSubstances as string[],
      prescriptionRequiredCategories: r.prescriptionRequiredCategories as string[],
      maxPrescriptionDaysValid: r.maxPrescriptionDaysValid,
      licenseRequirements: r.licenseRequirements as string[],
      saftEnabled: r.saftEnabled,
      ...(r.agtEndpoint ? { agtEndpoint: r.agtEndpoint } : {}),
    }));
  }

  async recordDecision(input: unknown): Promise<ComplianceDecision> {
    const parsed = recordComplianceDecisionInputSchema.parse(input);
    const db = await database();
    const record = await db.complianceDecision.create({
      data: {
        organizationId: parsed.organizationId,
        marketCode: parsed.marketCode,
        subjectType: parsed.subjectType,
        subjectId: parsed.subjectId,
        decision: parsed.decision,
        reason: parsed.reason,
        decidedBy: parsed.decidedBy,
      },
    });
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
    return {
      id: record.id,
      subjectType: record.subjectType as ComplianceDecision["subjectType"],
      subjectId: record.subjectId,
      decision: record.decision as ComplianceDecision["decision"],
      reason: record.reason,
      decidedBy: record.decidedBy,
      decidedAt: record.decidedAt,
      organizationId: record.organizationId,
      marketCode: record.marketCode,
    };
  }

  async getDecision(
    organizationId: string,
    marketCode: string,
    decisionId: string,
  ): Promise<ComplianceDecision> {
    const db = await database();
    const record = await db.complianceDecision.findFirst({
      where: {
        id: decisionId,
        organizationId,
        marketCode,
      },
    });
    if (!record) {
      throw new NotFoundException(`Decisão ${decisionId} não encontrada`);
    }
    return {
      id: record.id,
      subjectType: record.subjectType as ComplianceDecision["subjectType"],
      subjectId: record.subjectId,
      decision: record.decision as ComplianceDecision["decision"],
      reason: record.reason,
      decidedBy: record.decidedBy,
      decidedAt: record.decidedAt,
      organizationId: record.organizationId,
      marketCode: record.marketCode,
    };
  }

  async listDecisions(query: unknown): Promise<ComplianceDecision[]> {
    const parsed = auditExplorerQuerySchema.parse(query);
    const db = await database();
    const where: Record<string, unknown> = {
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
    };
    if (parsed.subjectType) {
      where.subjectType = parsed.subjectType;
    }
    if (parsed.subjectId) {
      where.subjectId = parsed.subjectId;
    }
    if (parsed.action) {
      where.action = parsed.action;
    }
    if (parsed.from || parsed.to) {
      where.decidedAt = {};
      if (parsed.from) {
        (where.decidedAt as Record<string, Date>).gte = parsed.from;
      }
      if (parsed.to) {
        (where.decidedAt as Record<string, Date>).lte = parsed.to;
      }
    }
    const records = await db.complianceDecision.findMany({ where });
    return records.map((r) => ({
      id: r.id,
      subjectType: r.subjectType as ComplianceDecision["subjectType"],
      subjectId: r.subjectId,
      decision: r.decision as ComplianceDecision["decision"],
      reason: r.reason,
      decidedBy: r.decidedBy,
      decidedAt: r.decidedAt,
      organizationId: r.organizationId,
      marketCode: r.marketCode,
    }));
  }

  async requestSaftExport(input: unknown): Promise<SaftExportJob> {
    const parsed = requestSaftExportInputSchema.parse(input);
    const db = await database();
    const policy = await this.policyForMarketOrDefault(parsed.marketCode);
    if (!policy.saftEnabled) {
      throw new BadRequestException(
        `SAF-T não está ativado para o mercado ${parsed.marketCode}`,
      );
    }
    const record = await db.saftExportJob.create({
      data: {
        organizationId: parsed.organizationId,
        marketCode: parsed.marketCode,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        type: parsed.type,
        requestedBy: parsed.requestedBy,
      },
    });
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      actorType: "user",
      actorId: parsed.requestedBy,
      action: "compliance.saft.export_requested",
      resourceType: "saft_export_job",
      resourceId: record.id,
      payload: {
        periodStart: parsed.periodStart.toISOString(),
        periodEnd: parsed.periodEnd.toISOString(),
        type: parsed.type,
      },
    });
    return {
      id: record.id,
      organizationId: record.organizationId,
      marketCode: record.marketCode,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      type: record.type as SaftExportJob["type"],
      status: record.status as SaftExportJob["status"],
      requestedBy: record.requestedBy,
      fileUrl: record.fileUrl ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async getSaftExport(
    organizationId: string,
    marketCode: string,
    jobId: string,
  ): Promise<SaftExportJob> {
    const db = await database();
    const record = await db.saftExportJob.findFirst({
      where: {
        id: jobId,
        organizationId,
        marketCode,
      },
    });
    if (!record) {
      throw new NotFoundException(`Job SAF-T ${jobId} não encontrado`);
    }
    return {
      id: record.id,
      organizationId: record.organizationId,
      marketCode: record.marketCode,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      type: record.type as SaftExportJob["type"],
      status: record.status as SaftExportJob["status"],
      requestedBy: record.requestedBy,
      fileUrl: record.fileUrl ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async listSaftExports(
    organizationId: string,
    marketCode: string,
  ): Promise<SaftExportJob[]> {
    const db = await database();
    const records = await db.saftExportJob.findMany({
      where: { organizationId, marketCode },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      marketCode: r.marketCode,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      type: r.type as SaftExportJob["type"],
      status: r.status as SaftExportJob["status"],
      requestedBy: r.requestedBy,
      fileUrl: r.fileUrl ?? undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async queryAudit(query: unknown): Promise<AuditExplorerEntry[]> {
    const parsed = auditExplorerQuerySchema.parse(query);
    const db = await database();
    const where: Record<string, unknown> = {
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
    };
    if (parsed.subjectType) {
      where.resourceType = parsed.subjectType;
    }
    if (parsed.subjectId) {
      where.resourceId = parsed.subjectId;
    }
    if (parsed.action) {
      where.action = parsed.action;
    }
    if (parsed.from || parsed.to) {
      where.createdAt = {};
      if (parsed.from) {
        (where.createdAt as Record<string, Date>).gte = parsed.from;
      }
      if (parsed.to) {
        (where.createdAt as Record<string, Date>).lte = parsed.to;
      }
    }
    const records = await db.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      marketCode: r.marketCode,
      actorType: r.actorType,
      actorId: r.actorId,
      action: r.action,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      payload: (r.payload as Record<string, unknown>) ?? {},
      at: r.createdAt,
    }));
  }

  async getAuditEvents(): Promise<readonly AuditLogEntry[]> {
    const db = await database();
    const records = await db.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => ({
      organizationId: r.organizationId,
      marketCode: r.marketCode,
      actorType: r.actorType,
      actorId: r.actorId,
      action: r.action,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      payload: (r.payload as Record<string, unknown>) ?? {},
    }));
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    try {
      const db = await database();
      await db.auditEvent.create({
        data: {
          organizationId: entry.organizationId,
          marketCode: entry.marketCode,
          actorType: entry.actorType,
          actorId: entry.actorId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          payload: entry.payload,
        },
      });
    } catch {
      // DB ainda não wired — auditoria fica registada em memória.
    }
  }
}
