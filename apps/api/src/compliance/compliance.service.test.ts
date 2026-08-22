import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ComplianceService, PLATFORM_ORG } from "./compliance.service.js";
import { regulatoryPolicySchema } from "@brocolis/contracts";

const ORG = "00000000-0000-4000-8000-000000000000";
const ORG_OTHER = "00000000-0000-4000-8000-000000000001";
const SUBJECT = "c1234567890abcdef00000001";

const scope = { organizationId: ORG, marketCode: "AO" } as const;

function makePolicy(overrides: Record<string, unknown> = {}) {
  return {
    id: `c${Math.random().toString(36).slice(2, 14)}`,
    marketCode: "AO",
    controlledSubstances: [],
    prescriptionRequiredCategories: [],
    maxPrescriptionDaysValid: 30,
    licenseRequirements: [],
    saftEnabled: false,
    agtEndpoint: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeDecision(overrides: Record<string, unknown> = {}) {
  return {
    id: `c${Math.random().toString(36).slice(2, 14)}`,
    organizationId: ORG,
    marketCode: "AO",
    subjectType: "HEALTHCARE_PROFESSIONAL" as const,
    subjectId: SUBJECT,
    decision: "APPROVED" as const,
    reason: "Credencial verificada",
    decidedBy: "compliance-officer",
    decidedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeSaftJob(overrides: Record<string, unknown> = {}) {
  return {
    id: `c${Math.random().toString(36).slice(2, 14)}`,
    organizationId: ORG,
    marketCode: "AO",
    periodStart: new Date("2026-07-01T00:00:00Z"),
    periodEnd: new Date("2026-07-31T23:59:59Z"),
    type: "FULL" as const,
    status: "QUEUED" as const,
    requestedBy: "platform-admin",
    fileUrl: null,
    createdAt: new Date("2026-07-01T00:00:00Z"),
    updatedAt: new Date("2026-07-01T00:00:00Z"),
    ...overrides,
  };
}

describe("ComplianceService — policies por mercado", () => {
  it("faz upsert de policy e devolve por mercado", async () => {
    const policy = makePolicy({ marketCode: "AO", saftEnabled: true });
    const db = {
      regulatoryPolicy: {
        upsert: vi.fn().mockResolvedValue(policy),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([policy]),
      },
      complianceDecision: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      saftExportJob: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      auditEvent: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    const result = await compliance.upsertPolicy(
      regulatoryPolicySchema.parse({
        marketCode: "ao",
        controlledSubstances: ["Diazepam"],
        maxPrescriptionDaysValid: 30,
        saftEnabled: true,
        agtEndpoint: "https://agt.gov.ao/saft",
      }),
    );
    expect(result.marketCode).toBe("AO");
    expect((await compliance.getPolicy("AO")).saftEnabled).toBe(true);
    expect(await compliance.listPolicies()).toHaveLength(1);
  });

  it("atualiza policy existente no mesmo mercado", async () => {
    const policy = makePolicy({ saftEnabled: true });
    const db = {
      regulatoryPolicy: {
        upsert: vi.fn().mockResolvedValue(policy),
        findUnique: vi.fn().mockResolvedValue(policy),
        findMany: vi.fn().mockResolvedValue([policy]),
      },
      complianceDecision: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      saftExportJob: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      auditEvent: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    await compliance.upsertPolicy(regulatoryPolicySchema.parse({ marketCode: "AO", saftEnabled: false }));
    await compliance.upsertPolicy(regulatoryPolicySchema.parse({ marketCode: "AO", saftEnabled: true }));
    expect(await compliance.listPolicies()).toHaveLength(1);
    expect((await compliance.getPolicy("AO")).saftEnabled).toBe(true);
  });

  it("fallback seguro para mercado sem policy (sem if de país)", async () => {
    const db = {
      regulatoryPolicy: {
        upsert: vi.fn(),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      complianceDecision: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      saftExportJob: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      auditEvent: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    const policy = await compliance.getPolicy("ke");
    expect(policy.marketCode).toBe("KE");
    expect(policy.controlledSubstances).toEqual([]);
    expect(policy.saftEnabled).toBe(false);
    expect(policy.maxPrescriptionDaysValid).toBe(30);
  });

  it("audita mutação de policy ao nível da plataforma", async () => {
    const policy = makePolicy();
    const audit = makePolicy();
    const db = {
      regulatoryPolicy: {
        upsert: vi.fn().mockResolvedValue(policy),
        findUnique: vi.fn().mockResolvedValue(policy),
        findMany: vi.fn().mockResolvedValue([policy]),
      },
      complianceDecision: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      saftExportJob: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      auditEvent: {
        findMany: vi.fn().mockResolvedValue([{ id: audit.id, action: "compliance.policy.upserted", organizationId: PLATFORM_ORG, marketCode: "AO" }]),
        create: vi.fn(),
      },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    await compliance.upsertPolicy(regulatoryPolicySchema.parse({ marketCode: "AO" }));
    const events = await compliance.queryAudit({
      organizationId: PLATFORM_ORG,
      marketCode: "AO",
    });
    const found = events.find((e) => e.action === "compliance.policy.upserted");
    expect(found?.organizationId).toBe(PLATFORM_ORG);
    expect(found?.marketCode).toBe("AO");
  });
});

describe("ComplianceService — decisões auditadas", () => {
  function decisionInput(overrides: Record<string, unknown> = {}) {
    return {
      ...scope,
      subjectType: "HEALTHCARE_PROFESSIONAL" as const,
      subjectId: SUBJECT,
      decision: "APPROVED" as const,
      reason: "Credencial verificada",
      decidedBy: "compliance-officer",
      ...overrides,
    };
  }

  it("registra decisão e audita sempre na mesma operação", async () => {
    const decision = makeDecision();
    const db = {
      regulatoryPolicy: { upsert: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
      complianceDecision: { create: vi.fn().mockResolvedValue(decision), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      saftExportJob: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      auditEvent: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    const result = await compliance.recordDecision(decisionInput());
    expect(result.decision).toBe("APPROVED");
    const audit = await compliance.queryAudit({
      organizationId: ORG,
      marketCode: "AO",
      action: "compliance.decision.recorded",
    });
    expect(audit[0]?.resourceType).toBe("HEALTHCARE_PROFESSIONAL");
    expect(audit[0]?.resourceId).toBe(SUBJECT);
    expect(audit[0]?.actorId).toBe("compliance-officer");
  });

  it("lista decisões filtrando por subject e período", async () => {
    const d1 = makeDecision();
    const d2 = makeDecision({ id: "c2", subjectType: "PHARMACY", subjectId: "c1234567890abcdef00000002", decision: "ESCALATED", reason: "Licença expirada" });
    const db = {
      regulatoryPolicy: { upsert: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
      complianceDecision: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([d1, d2]), count: vi.fn() },
      saftExportJob: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      auditEvent: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    const bySubject = await compliance.listDecisions({
      organizationId: ORG,
      marketCode: "AO",
      subjectType: "PHARMACY",
    });
    expect(bySubject).toHaveLength(1);
    expect(bySubject[0]?.decision).toBe("ESCALATED");

    const futureOnly = await compliance.listDecisions({
      organizationId: ORG,
      marketCode: "AO",
      from: new Date(Date.now() + 60_000),
    });
    expect(futureOnly).toHaveLength(0);
  });

  it("decisões respeitam isolamento por tenant", async () => {
    const decision = makeDecision();
    const db = {
      regulatoryPolicy: { upsert: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
      complianceDecision: {
        create: vi.fn().mockResolvedValue(decision),
        findFirst: vi.fn().mockImplementation(async (args: { where: Record<string, unknown> }) => {
          if (args.where.organizationId === ORG_OTHER) return null;
          return decision;
        }),
        findMany: vi.fn().mockResolvedValue([decision]),
        count: vi.fn(),
      },
      saftExportJob: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      auditEvent: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    const result = await compliance.recordDecision(decisionInput());
    await expect(
      compliance.getDecision(ORG_OTHER, "AO", result.id),
    ).rejects.toThrow(NotFoundException);
    expect(
      await compliance.listDecisions({
        organizationId: ORG_OTHER,
        marketCode: "AO",
      }),
    ).toEqual([]);
  });
});

describe("ComplianceService — exportação SAF-T", () => {
  const exportInput = {
    ...scope,
    periodStart: new Date("2026-07-01T00:00:00Z"),
    periodEnd: new Date("2026-07-31T23:59:59Z"),
    requestedBy: "platform-admin",
  };

  it("bloqueia exportação quando SAF-T não está ativo no mercado", async () => {
    const db = {
      regulatoryPolicy: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
      complianceDecision: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      saftExportJob: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      auditEvent: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    await expect(compliance.requestSaftExport(exportInput)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("cria job QUEUED com estrutura mock quando SAF-T ativo", async () => {
    const job = makeSaftJob();
    const db = {
      regulatoryPolicy: {
        findUnique: vi.fn().mockResolvedValue(makePolicy({ saftEnabled: true })),
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
      complianceDecision: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      saftExportJob: { create: vi.fn().mockResolvedValue(job), findFirst: vi.fn().mockResolvedValue(job), findMany: vi.fn() },
      auditEvent: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    const result = await compliance.requestSaftExport(exportInput);
    expect(result.status).toBe("QUEUED");
    expect(result.type).toBe("FULL");
    expect((await compliance.getSaftExport(ORG, "AO", result.id)).id).toBe(result.id);

    const audit = await compliance.queryAudit({
      organizationId: ORG,
      marketCode: "AO",
      action: "compliance.saft.export_requested",
    });
    expect(audit[0]?.resourceId).toBe(result.id);
  });

  it("getSaftExport respeita escopo de tenant", async () => {
    const job = makeSaftJob();
    const db = {
      regulatoryPolicy: { findUnique: vi.fn().mockResolvedValue(makePolicy({ saftEnabled: true })), upsert: vi.fn(), findMany: vi.fn() },
      complianceDecision: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      saftExportJob: {
        create: vi.fn().mockResolvedValue(job),
        findFirst: vi.fn().mockImplementation(async (args: { where: Record<string, unknown> }) => {
          if (args.where.organizationId === ORG_OTHER) return null;
          return job;
        }),
        findMany: vi.fn(),
      },
      auditEvent: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    const created = await compliance.requestSaftExport(exportInput);
    await expect(
      compliance.getSaftExport(ORG_OTHER, "AO", created.id),
    ).rejects.toThrow(NotFoundException);
  });
});

describe("ComplianceService — explorer de auditoria", () => {
  it("filtra eventos por ação e subject", async () => {
    const decision = makeDecision();
    const db = {
      regulatoryPolicy: { upsert: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
      complianceDecision: { create: vi.fn().mockResolvedValue(decision), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      saftExportJob: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      auditEvent: {
        findMany: vi.fn().mockResolvedValue([
          { id: "c1", action: "compliance.decision.recorded", organizationId: ORG, marketCode: "AO", resourceType: "E_PRESCRIPTION", resourceId: SUBJECT, createdAt: new Date() },
        ]),
        create: vi.fn(),
      },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    await compliance.recordDecision({
      ...scope,
      subjectType: "E_PRESCRIPTION" as const,
      subjectId: SUBJECT,
      decision: "REJECTED" as const,
      reason: "Receita fora da policy",
      decidedBy: "compliance-officer",
    });

    const matched = await compliance.queryAudit({
      organizationId: ORG,
      marketCode: "AO",
      action: "compliance.decision.recorded",
      subjectType: "E_PRESCRIPTION",
    });
    expect(matched).toHaveLength(1);

    const byAction = await compliance.queryAudit({
      organizationId: ORG,
      marketCode: "AO",
      action: "compliance.saft.export_requested",
    });
    expect(byAction).toHaveLength(0);
  });

  it("explorer exige organizationId e marketCode", async () => {
    const db = {
      regulatoryPolicy: { upsert: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
      complianceDecision: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      saftExportJob: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      auditEvent: { findMany: vi.fn(), create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const compliance = new ComplianceService();
    await expect(compliance.queryAudit({ action: "x" } as unknown as never)).rejects.toThrow();
  });
});
