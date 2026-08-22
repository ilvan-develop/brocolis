import { regulatoryPolicySchema } from "@brocolis/contracts";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { ComplianceService, PLATFORM_ORG } from "./compliance.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const ORG_OTHER = "00000000-0000-4000-8000-000000000001";
const SUBJECT = "c1234567890abcdef00000001";

const scope = { organizationId: ORG, marketCode: "AO" } as const;

describe("ComplianceService — policies por mercado", () => {
  it("faz upsert de policy e devolve por mercado", () => {
    const compliance = new ComplianceService();
    const policy = compliance.upsertPolicy(
      regulatoryPolicySchema.parse({
        marketCode: "ao",
        controlledSubstances: ["Diazepam"],
        maxPrescriptionDaysValid: 30,
        saftEnabled: true,
        agtEndpoint: "https://agt.gov.ao/saft",
      }),
    );
    expect(policy.marketCode).toBe("AO");
    expect(compliance.getPolicy("AO").saftEnabled).toBe(true);
    expect(compliance.listPolicies()).toHaveLength(1);
  });

  it("atualiza policy existente no mesmo mercado", () => {
    const compliance = new ComplianceService();
    compliance.upsertPolicy(
      regulatoryPolicySchema.parse({ marketCode: "AO", saftEnabled: false }),
    );
    compliance.upsertPolicy(
      regulatoryPolicySchema.parse({ marketCode: "AO", saftEnabled: true }),
    );
    expect(compliance.listPolicies()).toHaveLength(1);
    expect(compliance.getPolicy("AO").saftEnabled).toBe(true);
  });

  it("fallback seguro para mercado sem policy (sem if de país)", () => {
    const compliance = new ComplianceService();
    const policy = compliance.getPolicy("ke");
    expect(policy.marketCode).toBe("KE");
    expect(policy.controlledSubstances).toEqual([]);
    expect(policy.saftEnabled).toBe(false);
    expect(policy.maxPrescriptionDaysValid).toBe(30);
  });

  it("audita mutação de policy ao nível da plataforma", () => {
    const compliance = new ComplianceService();
    compliance.upsertPolicy(regulatoryPolicySchema.parse({ marketCode: "AO" }));
    const audit = compliance
      .getAuditEvents()
      .find((e) => e.action === "compliance.policy.upserted");
    expect(audit?.organizationId).toBe(PLATFORM_ORG);
    expect(audit?.marketCode).toBe("AO");
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

  it("registra decisão e audita sempre na mesma operação", () => {
    const compliance = new ComplianceService();
    const decision = compliance.recordDecision(decisionInput());
    expect(decision.decision).toBe("APPROVED");
    const audit = compliance
      .getAuditEvents()
      .find((e) => e.action === "compliance.decision.recorded");
    expect(audit?.resourceType).toBe("HEALTHCARE_PROFESSIONAL");
    expect(audit?.resourceId).toBe(SUBJECT);
    expect(audit?.actorId).toBe("compliance-officer");
  });

  it("lista decisões filtrando por subject e período", () => {
    const compliance = new ComplianceService();
    compliance.recordDecision(decisionInput());
    compliance.recordDecision(
      decisionInput({
        subjectType: "PHARMACY",
        subjectId: "c1234567890abcdef00000002",
        decision: "ESCALATED",
        reason: "Licença expirada",
      }),
    );

    const bySubject = compliance.listDecisions({
      organizationId: ORG,
      marketCode: "AO",
      subjectType: "PHARMACY",
    });
    expect(bySubject).toHaveLength(1);
    expect(bySubject[0]?.decision).toBe("ESCALATED");

    const futureOnly = compliance.listDecisions({
      organizationId: ORG,
      marketCode: "AO",
      from: new Date(Date.now() + 60_000),
    });
    expect(futureOnly).toHaveLength(0);
  });

  it("decisões respeitam isolamento por tenant", () => {
    const compliance = new ComplianceService();
    const decision = compliance.recordDecision(decisionInput());
    expect(() =>
      compliance.getDecision(ORG_OTHER, "AO", decision.id),
    ).toThrowError(NotFoundException);
    expect(
      compliance.listDecisions({
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

  it("bloqueia exportação quando SAF-T não está ativo no mercado", () => {
    const compliance = new ComplianceService();
    expect(() => compliance.requestSaftExport(exportInput)).toThrowError(
      BadRequestException,
    );
  });

  it("cria job QUEUED com estrutura mock quando SAF-T ativo", () => {
    const compliance = new ComplianceService();
    compliance.upsertPolicy(
      regulatoryPolicySchema.parse({ marketCode: "AO", saftEnabled: true }),
    );
    const job = compliance.requestSaftExport(exportInput);
    expect(job.status).toBe("QUEUED");
    expect(job.type).toBe("FULL");
    expect(compliance.getSaftExport(ORG, "AO", job.id).id).toBe(job.id);

    const audit = compliance
      .getAuditEvents()
      .find((e) => e.action === "compliance.saft.export_requested");
    expect(audit?.resourceId).toBe(job.id);
  });

  it("getSaftExport respeita escopo de tenant", () => {
    const compliance = new ComplianceService();
    compliance.upsertPolicy(
      regulatoryPolicySchema.parse({ marketCode: "AO", saftEnabled: true }),
    );
    const job = compliance.requestSaftExport(exportInput);
    expect(() =>
      compliance.getSaftExport(ORG_OTHER, "AO", job.id),
    ).toThrowError(NotFoundException);
  });
});

describe("ComplianceService — explorer de auditoria", () => {
  it("filtra eventos por ação e subject", () => {
    const compliance = new ComplianceService();
    compliance.recordDecision({
      ...scope,
      subjectType: "E_PRESCRIPTION",
      subjectId: SUBJECT,
      decision: "REJECTED",
      reason: "Receita fora da policy",
      decidedBy: "compliance-officer",
    });

    const matched = compliance.queryAudit({
      organizationId: ORG,
      marketCode: "AO",
      action: "compliance.decision.recorded",
      subjectType: "E_PRESCRIPTION",
    });
    expect(matched).toHaveLength(1);

    const byAction = compliance.queryAudit({
      organizationId: ORG,
      marketCode: "AO",
      action: "compliance.saft.export_requested",
    });
    expect(byAction).toHaveLength(0);
  });

  it("explorer exige organizationId e marketCode", () => {
    const compliance = new ComplianceService();
    expect(() => compliance.queryAudit({ action: "x" })).toThrowError();
  });
});
