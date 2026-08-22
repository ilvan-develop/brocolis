import { describe, expect, it } from "vitest";
import {
  auditExplorerQuerySchema,
  complianceDecisionSchema,
  DEFAULT_REGULATORY_POLICY,
  policyForMarket,
  recordComplianceDecisionInputSchema,
  regulatoryPolicySchema,
  requestSaftExportInputSchema,
  saftExportJobSchema,
} from "./compliance.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";

describe("regulatoryPolicy schemas", () => {
  it("aplica defaults seguros por mercado", () => {
    const policy = regulatoryPolicySchema.parse({
      marketCode: "ao",
      licenseRequirements: ["PharmacistLicense"],
    });
    expect(policy.marketCode).toBe("AO");
    expect(policy.controlledSubstances).toEqual([]);
    expect(policy.maxPrescriptionDaysValid).toBe(30);
    expect(policy.saftEnabled).toBe(false);
  });

  it("aceita policy completa com endpoint AGT", () => {
    const policy = regulatoryPolicySchema.parse({
      marketCode: "AO",
      controlledSubstances: ["Diazepam"],
      prescriptionRequiredCategories: ["Antibiotico"],
      maxPrescriptionDaysValid: 30,
      licenseRequirements: ["PharmacistLicense", "ImportPermit"],
      saftEnabled: true,
      agtEndpoint: "https://agt.gov.ao/saft",
    });
    expect(policy.saftEnabled).toBe(true);
    expect(policy.agtEndpoint).toBe("https://agt.gov.ao/saft");
  });

  it("rejeita marketCode inválido", () => {
    expect(() => regulatoryPolicySchema.parse({ marketCode: "ANG" })).toThrow();
  });
});

describe("policyForMarket", () => {
  const policies = [
    regulatoryPolicySchema.parse({
      marketCode: "AO",
      controlledSubstances: ["Diazepam"],
      maxPrescriptionDaysValid: 30,
      saftEnabled: true,
    }),
  ];

  it("devolve a policy do mercado quando existe", () => {
    const policy = policyForMarket("ao", policies);
    expect(policy.marketCode).toBe("AO");
    expect(policy.controlledSubstances).toEqual(["Diazepam"]);
  });

  it("faz fallback seguro para mercado desconhecido", () => {
    const policy = policyForMarket("ZZ", policies);
    expect(policy.marketCode).toBe("ZZ");
    expect(policy.controlledSubstances).toEqual([]);
    expect(policy.maxPrescriptionDaysValid).toBe(
      DEFAULT_REGULATORY_POLICY.maxPrescriptionDaysValid,
    );
    expect(policy.saftEnabled).toBe(false);
  });

  it("fallback seguro com lista vazia", () => {
    const policy = policyForMarket("KE", []);
    expect(policy.marketCode).toBe("KE");
    expect(policy.prescriptionRequiredCategories).toEqual([]);
  });
});

describe("complianceDecision schemas", () => {
  it("valida decisão registada", () => {
    const decision = complianceDecisionSchema.parse({
      id: cuid,
      subjectType: "HEALTHCARE_PROFESSIONAL",
      subjectId: cuid,
      decision: "APPROVED",
      reason: "Credencial verificada junto da ordem",
      decidedBy: "admin-platform",
      decidedAt: new Date(),
      organizationId: uuid,
      marketCode: "AO",
    });
    expect(decision.decision).toBe("APPROVED");
  });

  it("rejeita decisão fora do enum", () => {
    expect(() =>
      complianceDecisionSchema.parse({
        id: cuid,
        subjectType: "PHARMACY",
        subjectId: cuid,
        decision: "MAYBE",
        reason: "x",
        decidedBy: "admin",
        decidedAt: new Date(),
        organizationId: uuid,
        marketCode: "AO",
      }),
    ).toThrow();
  });

  it("input de decisão exige decidedBy e reason", () => {
    expect(() =>
      recordComplianceDecisionInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        subjectType: "PHARMACY",
        subjectId: cuid,
        decision: "ESCALATED",
      }),
    ).toThrow();
  });

  it("input aceita ESCALATED para escalada manual", () => {
    const input = recordComplianceDecisionInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      subjectType: "E_PRESCRIPTION",
      subjectId: cuid,
      decision: "ESCALATED",
      reason: "Substância controlada sem licença",
      decidedBy: "compliance-officer",
    });
    expect(input.subjectType).toBe("E_PRESCRIPTION");
  });
});

describe("saftExport schemas", () => {
  const base = {
    organizationId: uuid,
    marketCode: "AO",
    periodStart: new Date("2026-07-01T00:00:00Z"),
    periodEnd: new Date("2026-07-31T23:59:59Z"),
    requestedBy: "platform-admin",
  };

  it("pedido SAF-T aplica tipo FULL por defeito", () => {
    const input = requestSaftExportInputSchema.parse(base);
    expect(input.type).toBe("FULL");
  });

  it("rejeita período invertido", () => {
    expect(() =>
      requestSaftExportInputSchema.parse({
        ...base,
        periodStart: new Date("2026-08-01T00:00:00Z"),
        periodEnd: new Date("2026-07-01T00:00:00Z"),
      }),
    ).toThrow();
  });

  it("job nasce QUEUED", () => {
    const job = saftExportJobSchema.parse({
      id: cuid,
      organizationId: uuid,
      marketCode: "AO",
      periodStart: base.periodStart,
      periodEnd: base.periodEnd,
      requestedBy: "platform-admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(job.status).toBe("QUEUED");
    expect(job.type).toBe("FULL");
  });
});

describe("auditExplorerQuery schema", () => {
  it("exige organizationId e marketCode (isolamento)", () => {
    expect(() =>
      auditExplorerQuerySchema.parse({ subjectType: "PHARMACY" }),
    ).toThrow();
  });

  it("aceita filtros combinados", () => {
    const query = auditExplorerQuerySchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      subjectType: "E_PRESCRIPTION",
      subjectId: cuid,
      action: "rxdigital.prescription.dispensed",
      from: new Date("2026-08-01T00:00:00Z"),
      to: new Date("2026-08-20T00:00:00Z"),
    });
    expect(query.action).toBe("rxdigital.prescription.dispensed");
  });

  it("rejeita janela temporal invertida", () => {
    expect(() =>
      auditExplorerQuerySchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        from: new Date("2026-08-10T00:00:00Z"),
        to: new Date("2026-08-01T00:00:00Z"),
      }),
    ).toThrow();
  });
});
