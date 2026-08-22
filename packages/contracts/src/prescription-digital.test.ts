import { describe, expect, it } from "vitest";
import {
  controlledSubstancesIn,
  ePrescriptionExpiry,
  ePrescriptionSchema,
  healthcareProfessionalSchema,
  isEPrescriptionExpired,
  issueEPrescriptionInputSchema,
  renewEPrescriptionInputSchema,
  revokeEPrescriptionInputSchema,
  validateEPrescriptionInputSchema,
} from "./prescription-digital.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";

const credential = {
  type: "PharmacistLicense",
  number: "LIC-123456",
  issuedBy: "Ordem dos Farmacêuticos",
};

const item = {
  productId: cuid,
  activeSubstance: "Amoxicilina",
  dosage: "500mg",
  instructions: "1 cápsula a cada 8h durante 7 dias",
  quantity: 21,
};

describe("healthcareProfessional schemas", () => {
  it("cria profissional PENDING por defeito", () => {
    const now = new Date();
    const professional = healthcareProfessionalSchema.parse({
      id: cuid,
      name: "Dra. Ana Silva",
      credential,
      specialty: "Medicina Geral",
      marketCode: "AO",
      organizationId: uuid,
      createdAt: now,
      updatedAt: now,
    });
    expect(professional.verificationStatus).toBe("PENDING");
  });

  it("rejeita credencial sem número", () => {
    const now = new Date();
    expect(() =>
      healthcareProfessionalSchema.parse({
        id: cuid,
        name: "Dra. Ana Silva",
        credential: { type: "PharmacistLicense" },
        specialty: "Medicina Geral",
        marketCode: "AO",
        organizationId: uuid,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it("rejeita status de verificação desconhecido", () => {
    const now = new Date();
    expect(() =>
      healthcareProfessionalSchema.parse({
        id: cuid,
        name: "Dra. Ana Silva",
        credential,
        specialty: "Medicina Geral",
        marketCode: "AO",
        verificationStatus: "APPROVED",
        organizationId: uuid,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });
});

describe("ePrescription schemas", () => {
  const issuedAt = new Date("2026-08-20T09:00:00Z");

  function rxInput(overrides: Record<string, unknown> = {}) {
    return {
      id: cuid,
      professionalId: cuid,
      patientRef: cuid,
      items: [item],
      issuedAt,
      expiresAt: ePrescriptionExpiry(issuedAt, 30),
      daysValid: 30,
      signatureHash: "a".repeat(64),
      sourceMarketCode: "AO",
      organizationId: uuid,
      marketCode: "AO",
      createdAt: issuedAt,
      updatedAt: issuedAt,
      ...overrides,
    };
  }

  it("valida receita ACTIVE por defeito", () => {
    const rx = ePrescriptionSchema.parse(rxInput());
    expect(rx.status).toBe("ACTIVE");
    expect(rx.items).toHaveLength(1);
  });

  it("rejeita expiresAt anterior a issuedAt", () => {
    expect(() =>
      ePrescriptionSchema.parse(
        rxInput({ expiresAt: new Date(issuedAt.getTime() - 1000) }),
      ),
    ).toThrow();
  });

  it("rejeita receita sem itens", () => {
    expect(() => ePrescriptionSchema.parse(rxInput({ items: [] }))).toThrow();
  });

  it("issueEPrescription aplica daysValid por defeito (30)", () => {
    const input = issueEPrescriptionInputSchema.parse({
      organizationId: uuid,
      marketCode: "ao",
      professionalId: cuid,
      patientRef: cuid,
      items: [item],
    });
    expect(input.daysValid).toBe(30);
    expect(input.marketCode).toBe("AO");
  });

  it("rejeita issue com mais de 20 itens", () => {
    expect(() =>
      issueEPrescriptionInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        professionalId: cuid,
        patientRef: cuid,
        items: Array.from({ length: 21 }, () => item),
      }),
    ).toThrow();
  });

  it("validate exige pharmacyId do scoped tenant", () => {
    const input = validateEPrescriptionInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      prescriptionId: cuid,
      pharmacyId: cuid,
    });
    expect(input.pharmacyId).toBe(cuid);
    expect(() =>
      validateEPrescriptionInputSchema.parse({ organizationId: uuid }),
    ).toThrow();
  });

  it("revoke exige motivo", () => {
    expect(() =>
      revokeEPrescriptionInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        prescriptionId: cuid,
      }),
    ).toThrow();
  });

  it("renew valida dias entre 1 e 365", () => {
    const input = renewEPrescriptionInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      prescriptionId: cuid,
      daysValid: 15,
    });
    expect(input.daysValid).toBe(15);
    expect(() =>
      renewEPrescriptionInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        prescriptionId: cuid,
        daysValid: 400,
      }),
    ).toThrow();
  });
});

describe("prescription-digital helpers", () => {
  const issuedAt = new Date("2026-08-01T09:00:00Z");

  it("ePrescriptionExpiry soma dias corridos", () => {
    expect(ePrescriptionExpiry(issuedAt, 30)).toEqual(
      new Date("2026-08-31T09:00:00Z"),
    );
  });

  it("isEPrescriptionExpired marca expirada após expiresAt", () => {
    const rx = {
      status: "ACTIVE" as const,
      expiresAt: ePrescriptionExpiry(issuedAt, 7),
    };
    expect(isEPrescriptionExpired(rx, new Date("2026-08-08T09:00:01Z"))).toBe(
      true,
    );
    expect(isEPrescriptionExpired(rx, new Date("2026-08-08T09:00:00Z"))).toBe(
      false,
    );
  });

  it("isEPrescriptionExpired ignora receitas dispensadas", () => {
    const rx = {
      status: "DISPENSED" as const,
      expiresAt: new Date("2026-01-01T00:00:00Z"),
    };
    expect(isEPrescriptionExpired(rx, new Date("2026-08-20T00:00:00Z"))).toBe(
      false,
    );
  });

  it("controlledSubstancesIn cruza itens com a policy do mercado", () => {
    const items = [
      { ...item, activeSubstance: "Diazepam" },
      { ...item, activeSubstance: "amoxicilina" },
      { ...item, activeSubstance: "Paracetamol" },
    ];
    const result = controlledSubstancesIn(items, ["diazepam", "MORFINA"]);
    expect(result).toEqual(["Diazepam"]);
  });

  it("controlledSubstancesIn devolve vazio sem policy", () => {
    expect(controlledSubstancesIn([item], [])).toEqual([]);
  });
});
