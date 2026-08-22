import {
  type EPrescription,
  regulatoryPolicySchema,
} from "@brocolis/contracts";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { ComplianceService } from "../compliance/compliance.service.js";
import {
  PrescriptionDigitalService,
  type PrescriptionScope,
} from "./prescription-digital.service.js";

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

function registerVerifiedProfessional(
  rxdigital: PrescriptionDigitalService,
): string {
  const professional = rxdigital.registerProfessional({
    ...scope,
    name: PROFESSIONAL_NAME,
    credential,
    specialty: "Medicina Geral",
  });
  rxdigital.setVerification({
    ...scope,
    professionalId: professional.id,
    status: "VERIFIED",
    decidedBy: "compliance-officer",
  });
  return professional.id;
}

function issueRx(
  rxdigital: PrescriptionDigitalService,
  professionalId: string,
  items: unknown[] = [item],
  daysValid?: number,
): EPrescription {
  return rxdigital.issue({
    ...scope,
    professionalId,
    patientRef: "c1234567890abcdef00000031",
    items,
    ...(daysValid === undefined ? {} : { daysValid }),
  });
}

describe("PrescriptionDigitalService — profissionais", () => {
  it("regista profissional PENDING e verifica depois", () => {
    const { rxdigital } = setup();
    const professional = rxdigital.registerProfessional({
      ...scope,
      name: PROFESSIONAL_NAME,
      credential,
      specialty: "Medicina Geral",
    });
    expect(professional.verificationStatus).toBe("PENDING");

    const verified = rxdigital.setVerification({
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

  it("verificação exige escopo de tenant", () => {
    const { rxdigital } = setup();
    const professional = rxdigital.registerProfessional({
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
    ).toThrowError(NotFoundException);
  });
});

describe("PrescriptionDigitalService — emitir", () => {
  it("emite receita ACTIVE assinada com expiração por dias", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const before = new Date();
    const rx = issueRx(rxdigital, professionalId);

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

  it("bloqueia emissão por profissional não verificado", () => {
    const { rxdigital } = setup();
    const professional = rxdigital.registerProfessional({
      ...scope,
      name: PROFESSIONAL_NAME,
      credential,
      specialty: "Medicina Geral",
    });
    expect(() => issueRx(rxdigital, professional.id)).toThrowError(
      BadRequestException,
    );
  });

  it("bloqueia daysValid acima do máximo regulatório do mercado", () => {
    const { compliance, rxdigital } = setup();
    compliance.upsertPolicy(
      regulatoryPolicySchema.parse({
        marketCode: "AO",
        maxPrescriptionDaysValid: 30,
      }),
    );
    const professionalId = registerVerifiedProfessional(rxdigital);
    expect(() => issueRx(rxdigital, professionalId, [item], 90)).toThrowError(
      /máximo regulatório/,
    );
  });

  it("aceita daysValid dentro do máximo do mercado", () => {
    const { compliance, rxdigital } = setup();
    compliance.upsertPolicy(
      regulatoryPolicySchema.parse({
        marketCode: "AO",
        maxPrescriptionDaysValid: 90,
      }),
    );
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId, [item], 60);
    expect(rx.daysValid).toBe(60);
  });

  it("usa fallback de policy para mercado sem policy explícita", () => {
    const { rxdigital } = setup();
    expect(rxdigital.policyFor("KE").maxPrescriptionDaysValid).toBe(30);
    expect(rxdigital.policyFor("KE").controlledSubstances).toEqual([]);
  });
});

describe("PrescriptionDigitalService — validar na farmácia", () => {
  it("valida receita ativa e não controlada", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId);

    const result = rxdigital.validate({
      ...scope,
      prescriptionId: rx.id,
      pharmacyId: PHARMACY,
    });
    expect(result.valid).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.controlledSubstances).toEqual([]);
  });

  it("sinaliza substâncias controladas vindas da policy do mercado", () => {
    const { compliance, rxdigital } = setup();
    compliance.upsertPolicy(
      regulatoryPolicySchema.parse({
        marketCode: "AO",
        controlledSubstances: ["Diazepam"],
      }),
    );
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId, [item, controlledItem]);

    const result = rxdigital.validate({
      ...scope,
      prescriptionId: rx.id,
      pharmacyId: PHARMACY,
    });
    expect(result.valid).toBe(false);
    expect(result.controlledSubstances).toEqual(["Diazepam"]);
    expect(result.reasons[0]).toContain("Diazepam");
  });

  it("invalida receita expirada (expiração por dias)", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId, [item], 1);
    rx.expiresAt = new Date(Date.now() - 1000);

    const result = rxdigital.validate({
      ...scope,
      prescriptionId: rx.id,
      pharmacyId: PHARMACY,
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("Receita expirada");
  });

  it("invalida receita revogada", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId);
    rxdigital.revoke({
      ...scope,
      prescriptionId: rx.id,
      reason: "Erro de prescrição",
    });

    const result = rxdigital.validate({
      ...scope,
      prescriptionId: rx.id,
      pharmacyId: PHARMACY,
    });
    expect(result.valid).toBe(false);
    expect(result.reasons[0]).toContain("REVOKED");
  });

  it("validação respeita isolamento por tenant", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId);
    expect(() =>
      rxdigital.validate({
        organizationId: ORG_OTHER,
        marketCode: "AO",
        prescriptionId: rx.id,
        pharmacyId: PHARMACY,
      }),
    ).toThrowError(NotFoundException);
  });
});

describe("PrescriptionDigitalService — dispensar, revogar, renovar", () => {
  it("dispensa receita válida e marca DISPENSED com auditoria", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId);

    const dispensed = rxdigital.dispense(
      { ...scope, prescriptionId: rx.id, pharmacyId: PHARMACY },
      "c1234567890abcdef00000041",
    );
    expect(dispensed.status).toBe("DISPENSED");
    const audit = rxdigital
      .getAuditEvents()
      .find((e) => e.action === "rxdigital.prescription.dispensed");
    expect(audit?.payload.pharmacistId).toBe("c1234567890abcdef00000041");
  });

  it("bloqueia dispensa de receita expirada", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId, [item], 1);
    rx.expiresAt = new Date(Date.now() - 1000);
    expect(() =>
      rxdigital.dispense(
        { ...scope, prescriptionId: rx.id, pharmacyId: PHARMACY },
        "pharmacist",
      ),
    ).toThrowError(/expirada/);
  });

  it("bloqueia dupla dispensa", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId);
    rxdigital.dispense(
      { ...scope, prescriptionId: rx.id, pharmacyId: PHARMACY },
      "pharmacist",
    );
    expect(() =>
      rxdigital.dispense(
        { ...scope, prescriptionId: rx.id, pharmacyId: PHARMACY },
        "pharmacist",
      ),
    ).toThrowError(BadRequestException);
  });

  it("revoga receita ativa com motivo auditado", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId);
    const revoked = rxdigital.revoke({
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

  it("renova receita ativa e recalcula expiresAt", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId, [item], 7);
    const renewed = rxdigital.renew({
      ...scope,
      prescriptionId: rx.id,
      daysValid: 14,
    });
    expect(renewed.daysValid).toBe(14);
    expect(renewed.expiresAt.getTime()).toBeGreaterThan(rx.issuedAt.getTime());
    expect(renewed.status).toBe("ACTIVE");
  });

  it("não renova receita dispensada", () => {
    const { rxdigital } = setup();
    const professionalId = registerVerifiedProfessional(rxdigital);
    const rx = issueRx(rxdigital, professionalId);
    rxdigital.dispense(
      { ...scope, prescriptionId: rx.id, pharmacyId: PHARMACY },
      "pharmacist",
    );
    expect(() =>
      rxdigital.renew({ ...scope, prescriptionId: rx.id, daysValid: 14 }),
    ).toThrowError(BadRequestException);
  });
});
