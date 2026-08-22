import { describe, expect, it } from "vitest";
import {
  expirationRulesSchema,
  prescriptionSchema,
  respondPrescriptionInputSchema,
  uploadPrescriptionInputSchema,
} from "./prescription.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";

const file = { uri: "https://cdn.brocolis.ao/rx/1.jpg", type: "image/jpeg" };

describe("prescription schemas", () => {
  it("valida prescription PENDING por defeito", () => {
    const p = prescriptionSchema.parse({
      id: cuid,
      orderId: cuid,
      attachments: ["https://cdn.brocolis.ao/rx/1.jpg"],
      organizationId: uuid,
      marketCode: "AO",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(p.status).toBe("PENDING");
    expect(p.attachments).toHaveLength(1);
  });

  it("rejeita prescription com mais de 4 anexos", () => {
    expect(() =>
      prescriptionSchema.parse({
        id: cuid,
        orderId: cuid,
        attachments: Array.from(
          { length: 5 },
          (_, i) => `https://cdn.brocolis.ao/rx/${i}.jpg`,
        ),
        organizationId: uuid,
        marketCode: "AO",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it("rejeita anexo com URL inválida", () => {
    expect(() =>
      prescriptionSchema.parse({
        id: cuid,
        orderId: cuid,
        attachments: ["not-a-url"],
        organizationId: uuid,
        marketCode: "AO",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it("uploadPrescription aceita 1..4 ficheiros", () => {
    const parsed = uploadPrescriptionInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      orderId: cuid,
      files: [file],
    });
    expect(parsed.files).toHaveLength(1);
  });

  it("rejeita upload sem ficheiros", () => {
    expect(() =>
      uploadPrescriptionInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        orderId: cuid,
        files: [],
      }),
    ).toThrow();
  });

  it("rejeita upload com 5 ficheiros", () => {
    expect(() =>
      uploadPrescriptionInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        orderId: cuid,
        files: Array.from({ length: 5 }, () => file),
      }),
    ).toThrow();
  });

  it("rejeita ficheiro com MIME desconhecido", () => {
    expect(() =>
      uploadPrescriptionInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        orderId: cuid,
        files: [
          {
            uri: "https://cdn.brocolis.ao/rx/1.exe",
            type: "application/x-download",
          },
        ],
      }),
    ).not.toThrow();
  });

  it("respondPrescription aceita APPROVE com notas", () => {
    const parsed = respondPrescriptionInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      prescriptionId: cuid,
      action: "APPROVE",
      notes: "receita válida",
    });
    expect(parsed.action).toBe("APPROVE");
    expect(parsed.notes).toBe("receita válida");
  });

  it("rejeita ação desconhecida", () => {
    expect(() =>
      respondPrescriptionInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        prescriptionId: cuid,
        action: "HOLD",
      }),
    ).toThrow();
  });

  it("expirationRules default 30 dias sem controlados", () => {
    const rules = expirationRulesSchema.parse({});
    expect(rules.daysValid).toBe(30);
    expect(rules.controlledSubstances).toEqual([]);
  });

  it("rejeita expirationRules com dias inválidos", () => {
    expect(() => expirationRulesSchema.parse({ daysValid: 0 })).toThrow();
  });
});
