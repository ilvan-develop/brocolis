import {
  type EPrescription,
  regulatoryPolicySchema,
} from "@brocolis/contracts";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ComplianceService } from "../compliance/compliance.service.js";
import {
  PrescriptionDigitalService,
  type PrescriptionScope,
} from "./prescription-digital.service.js";

vi.mock("@brocolis/db", () => {
  const store: Record<string, unknown> = {};
  const auditStore: Array<Record<string, unknown>> = [];
  return {
    database: () => ({
      regulatoryPolicy: {
        findMany: () =>
          Promise.resolve(Object.values(store) as Record<string, unknown>[]),
        findUnique: ({ where }: any) => {
          const key = `policy:${(where?.marketCode ?? "").trim().toUpperCase()}`;
          return Promise.resolve(
            (store[key] as Record<string, unknown> | undefined) ?? null,
          );
        },
        upsert: ({ where, create, update }: any) => {
          const key = `policy:${(where.marketCode ?? "").trim().toUpperCase()}`;
          const existing = store[key] as Record<string, unknown> | undefined;
          const record = existing
            ? { ...existing, ...update }
            : {
                ...create,
                id: `c${Date.now().toString(36).padStart(12, "0")}`,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
          store[key] = record;
          return Promise.resolve(record);
        },
      },
      complianceDecision: {
        findMany: () => Promise.resolve([]),
        create: ({ data }: any) => {
          const record = {
            ...data,
            id: `c${Date.now().toString(36).padStart(12, "0")}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return Promise.resolve(record);
        },
      },
      auditEvent: {
        findMany: ({ where }: any) => {
          let events = [...auditStore];
          if (where?.action)
            events = events.filter((e: any) => e.action === where.action);
          if (where?.resourceType)
            events = events.filter(
              (e: any) => e.resourceType === where.resourceType,
            );
          return Promise.resolve(events);
        },
        create: ({ data }: any) => {
          const record = {
            ...data,
            id: `c${Date.now().toString(36).padStart(12, "0")}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          auditStore.push(record);
          return Promise.resolve(record);
        },
      },
    }),
  };
});

const ORG = "00000000-0000-4000-8000-000000000000";
const ORG_OTHER = "00000000-0000-4000-8000-000000000001";
const PHARMACY = "c1234567890abcdef00000001";
const PROFESSIONAL_NAME = "Dra. Ana Silva";

const scope: PrescriptionScope = {
  organizationId: ORG,
  marketCode: "AO",
};

const credential = {
  type: "PharmacistLicense",
  number: "LIC-123456",
  issuedBy: "Ordem dos Farmacêuticos",
};

const item = {
  productId: "c1234567890abcdef00000021",
  activeSubstance: "Amoxicilina",
  dosage: "500mg",
  instructions: "1 cápsula a cada 8h durante 7 dias",
  quantity: 21,
};

const controlledItem = {
  productId: "c1234567890abcdef00000022",
  activeSubstance: "Diazepam",
  dosage: "5mg",
  instructions: "1 comprimido à noite se necessário",
  quantity: 10,
};

function setup(): {
  compliance: ComplianceService;
  rxdigital: PrescriptionDigitalService;
} {
  const compliance = new ComplianceService();
  const rxdigital = new PrescriptionDigitalService(compliance);
  return { compliance, rxdigital };
}

async function registerVerifiedProfessional(
  rxdigital: PrescriptionDigitalService,
): Promise<string> {
  const professional = await rxdigital.registerProfessional({
    ...scope,
    name: PROFESSIONAL_NAME,
    credential,
    specialty: "Medicina Geral",
  });
  await rxdigital.setVerification({
    ...scope,
    professionalId: professional.id,
    status: "VERIFIED",
    decidedBy: "compliance-officer",
  });
  return professional.id;
}

async function issueRx(
  rxdigital: PrescriptionDigitalService,
  professionalId: string,
  items: unknown[] = [item],
  daysValid?: number,
): Promise<EPrescription> {
  return rxdigital.issue({
    ...scope,
    professionalId,
    patientRef: "c1234567890abcdef00000031",
    items,
    ...(daysValid === undefined ? {} : { daysValid }),
  });
}

describe("PrescriptionDigitalService — profissionais", () => {
  it("regista profissional PENDING e verifica depois", async () => {
    const { rxdigital } = setup();
    const professional = await rxdigital.registerProfessional({
      ...scope,
      name: PROFESSIONAL_NAME,
      credential,
      specialty: "Medicina Geral",
    });
    expect(professional.verificationStatus).toBe("PENDING");

    const verified = await rxdigital.setVerification({
      ...scope,
      professionalId: professional.id,
      status: "VERIFIED",
      decidedBy: "compliance-officer",
    });
    expect(verified.verificationStatus).toBe("VERIFIED");
    expect(
      rxdigital
        .getAuditEvents()
        .some((e) => e.action === "rxdigital.professional.verified"),
    ).toBe(true);
  });

  it("verificação exige escopo de tenant", async () => {
    const { rxdigital } = setup();
    const professional = await rxdigital.registerProfessional({
      ...scope,
      name: PROFESSIONAL_NAME,
      credential,
      specialty: "Medicina Geral",
    });
    expect(() =>
      rxdigital.setVerification({
        organizationId: ORG_OTHER,
        marketCode: "AO",
        professionalId: professional.id,
        status: "VERIFIED",
        decidedBy: "compliance-officer",
      }),
    ).toThrow(NotFoundException);
  });
});

describe("PrescriptionDigitalService — emitir", () => {
  it("emite receita ACTIVE assinada com expiração por dias", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const before = new Date();
    const rx = await issueRx(rxdigital, professionalId);

    expect(rx.status).toBe("ACTIVE");
    expect(rx.signatureHash).toHaveLength(64);
    expect(rx.daysValid).toBe(30);
    expect(rx.expiresAt.getTime()).toBe(
      rx.issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    expect(rx.issuedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(
      rxdigital
        .getAuditEvents()
        .some((e) => e.action === "rxdigital.prescription.issued"),
    ).toBe(true);
  });

  it("bloqueia emissão por profissional não verificado", async () => {
    const { rxdigital } = setup();
    const professional = await rxdigital.registerProfessional({
      ...scope,
      name: PROFESSIONAL_NAME,
      credential,
      specialty: "Medicina Geral",
    });
    await expect(issueRx(rxdigital, professional.id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("bloqueia daysValid acima do máximo regulatório do mercado", async () => {
    const { compliance, rxdigital } = setup();
    compliance.upsertPolicy(
      regulatoryPolicySchema.parse({
        marketCode: "AO",
        maxPrescriptionDaysValid: 30,
      }),
    );
    const professionalId = await registerVerifiedProfessional(rxdigital);
    await expect(
      issueRx(rxdigital, professionalId, [item], 90),
    ).rejects.toThrow(/máximo regulatório/);
  });

  it("aceita daysValid dentro do máximo do mercado", async () => {
    const { compliance, rxdigital } = setup();
    compliance.upsertPolicy(
      regulatoryPolicySchema.parse({
        marketCode: "AO",
        maxPrescriptionDaysValid: 90,
      }),
    );
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId, [item], 60);
    expect(rx.daysValid).toBe(60);
  });

  it("usa fallback de policy para mercado sem policy explícita", async () => {
    const { rxdigital } = setup();
    expect((await rxdigital.policyFor("KE")).maxPrescriptionDaysValid).toBe(30);
    expect((await rxdigital.policyFor("KE")).controlledSubstances).toEqual([]);
  });
});

describe("PrescriptionDigitalService — validar na farmácia", () => {
  it("valida receita ativa e não controlada", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId);

    const result = await rxdigital.validate({
      ...scope,
      prescriptionId: rx.id,
      pharmacyId: PHARMACY,
    });
    expect(result.valid).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.controlledSubstances).toEqual([]);
  });

  it("sinaliza substâncias controladas vindas da policy do mercado", async () => {
    const { compliance, rxdigital } = setup();
    compliance.upsertPolicy(
      regulatoryPolicySchema.parse({
        marketCode: "AO",
        controlledSubstances: ["Diazepam"],
      }),
    );
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId, [item, controlledItem]);

    const result = await rxdigital.validate({
      ...scope,
      prescriptionId: rx.id,
      pharmacyId: PHARMACY,
    });
    expect(result.valid).toBe(false);
    expect(result.controlledSubstances).toEqual(["Diazepam"]);
    expect(result.reasons[0]).toContain("Diazepam");
  });

  it("invalida receita expirada (expiração por dias)", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId, [item], 1);
    rx.expiresAt = new Date(Date.now() - 1000);

    const result = await rxdigital.validate({
      ...scope,
      prescriptionId: rx.id,
      pharmacyId: PHARMACY,
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("Receita expirada");
  });

  it("invalida receita revogada", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId);
    await rxdigital.revoke({
      ...scope,
      prescriptionId: rx.id,
      reason: "Erro de prescrição",
    });

    const result = await rxdigital.validate({
      ...scope,
      prescriptionId: rx.id,
      pharmacyId: PHARMACY,
    });
    expect(result.valid).toBe(false);
    expect(result.reasons[0]).toContain("REVOKED");
  });

  it("validação respeita isolamento por tenant", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId);
    await expect(
      rxdigital.validate({
        organizationId: ORG_OTHER,
        marketCode: "AO",
        prescriptionId: rx.id,
        pharmacyId: PHARMACY,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe("PrescriptionDigitalService — dispensar, revogar, renovar", () => {
  it("dispensa receita válida e marca DISPENSED com auditoria", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId);

    const dispensed = await rxdigital.dispense(
      { ...scope, prescriptionId: rx.id, pharmacyId: PHARMACY },
      "c1234567890abcdef00000041",
    );
    expect(dispensed.status).toBe("DISPENSED");
    const audit = rxdigital
      .getAuditEvents()
      .find((e) => e.action === "rxdigital.prescription.dispensed");
    expect(audit?.payload.pharmacistId).toBe("c1234567890abcdef00000041");
  });

  it("bloqueia dispensa de receita expirada", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId, [item], 1);
    rx.expiresAt = new Date(Date.now() - 1000);
    expect(() =>
      rxdigital.dispense(
        { ...scope, prescriptionId: rx.id, pharmacyId: PHARMACY },
        "pharmacist",
      ),
    ).toThrow(/expirada/);
  });

  it("bloqueia dupla dispensa", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId);
    await rxdigital.dispense(
      { ...scope, prescriptionId: rx.id, pharmacyId: PHARMACY },
      "pharmacist",
    );
    expect(() =>
      rxdigital.dispense(
        { ...scope, prescriptionId: rx.id, pharmacyId: PHARMACY },
        "pharmacist",
      ),
    ).toThrow(BadRequestException);
  });

  it("revoga receita ativa com motivo auditado", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId);
    const revoked = await rxdigital.revoke({
      ...scope,
      prescriptionId: rx.id,
      reason: "Erro de posologia",
    });
    expect(revoked.status).toBe("REVOKED");
    const audit = rxdigital
      .getAuditEvents()
      .find((e) => e.action === "rxdigital.prescription.revoked");
    expect(audit?.payload.reason).toBe("Erro de posologia");
  });

  it("renova receita ativa e recalcula expiresAt", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId, [item], 7);
    const renewed = await rxdigital.renew({
      ...scope,
      prescriptionId: rx.id,
      daysValid: 14,
    });
    expect(renewed.daysValid).toBe(14);
    expect(renewed.expiresAt.getTime()).toBeGreaterThan(rx.issuedAt.getTime());
    expect(renewed.status).toBe("ACTIVE");
  });

  it("não renova receita dispensada", async () => {
    const { rxdigital } = setup();
    const professionalId = await registerVerifiedProfessional(rxdigital);
    const rx = await issueRx(rxdigital, professionalId);
    await rxdigital.dispense(
      { ...scope, prescriptionId: rx.id, pharmacyId: PHARMACY },
      "pharmacist",
    );
    await expect(
      rxdigital.renew({ ...scope, prescriptionId: rx.id, daysValid: 14 }),
    ).rejects.toThrow(BadRequestException);
  });
});
