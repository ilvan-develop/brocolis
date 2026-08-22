import { describe, expect, it } from "vitest";
import {
  createSettlementInputSchema,
  pharmacistSchema,
  pharmacySettlementSchema,
  refundSchema,
  requestRefundInputSchema,
  verifyPharmacyInputSchema,
} from "./pharmacy.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";

describe("pharmacy schemas", () => {
  it("valida pharmacist com role PHARMACIST fixa", () => {
    const ph = pharmacistSchema.parse({
      id: cuid,
      pharmacyId: cuid,
      userId: cuid,
      role: "PHARMACIST",
      organizationId: uuid,
      marketCode: "AO",
      createdAt: new Date(),
    });
    expect(ph.role).toBe("PHARMACIST");
    expect(ph.active).toBe(true);
  });

  it("rejeita pharmacist com outra role", () => {
    expect(() =>
      pharmacistSchema.parse({
        id: cuid,
        pharmacyId: cuid,
        userId: cuid,
        role: "OWNER",
        organizationId: uuid,
        marketCode: "AO",
        createdAt: new Date(),
      }),
    ).toThrow();
  });

  it("verifyPharmacy assume VERIFIED por defeito", () => {
    const parsed = verifyPharmacyInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      pharmacyId: cuid,
    });
    expect(parsed.status).toBe("VERIFIED");
  });

  it("verifyPharmacy rejeita status inválido", () => {
    expect(() =>
      verifyPharmacyInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        pharmacyId: cuid,
        status: "BANNED",
      }),
    ).toThrow();
  });

  it("valida settlement com comissão e reserva em minor units", () => {
    const s = pharmacySettlementSchema.parse({
      id: cuid,
      pharmacyId: cuid,
      organizationId: uuid,
      marketCode: "AO",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-07"),
      grossMinor: 100000,
      commissionRateBps: 500,
      commissionMinor: 4750,
      netMinor: 90250,
      reserveMinor: 0,
      createdAt: new Date(),
    });
    expect(s.status).toBe("PENDING");
    expect(s.grossMinor).toBe(100000);
  });

  it("rejeita settlement com gross negativo", () => {
    expect(() =>
      pharmacySettlementSchema.parse({
        id: cuid,
        pharmacyId: cuid,
        organizationId: uuid,
        marketCode: "AO",
        periodStart: new Date("2026-07-01"),
        periodEnd: new Date("2026-07-07"),
        grossMinor: -1,
        commissionRateBps: 500,
        commissionMinor: 0,
        netMinor: 0,
        reserveMinor: 0,
        createdAt: new Date(),
      }),
    ).toThrow();
  });

  it("rejeita settlement com período invertido", () => {
    expect(() =>
      pharmacySettlementSchema.parse({
        id: cuid,
        pharmacyId: cuid,
        organizationId: uuid,
        marketCode: "AO",
        periodStart: new Date("2026-07-07"),
        periodEnd: new Date("2026-07-01"),
        grossMinor: 0,
        commissionRateBps: 500,
        commissionMinor: 0,
        netMinor: 0,
        reserveMinor: 0,
        createdAt: new Date(),
      }),
    ).toThrow(/periodEnd/);
  });

  it("createSettlementInput valida período semanal", () => {
    const parsed = createSettlementInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      pharmacyId: cuid,
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-07"),
    });
    expect(parsed.periodEnd).toBeInstanceOf(Date);
  });

  it("refund assume INITIATED com reason", () => {
    const r = refundSchema.parse({
      id: cuid,
      orderId: cuid,
      amountMinor: 3000,
      reason: "devolução",
      organizationId: uuid,
      marketCode: "AO",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(r.status).toBe("INITIATED");
  });

  it("rejeita refund sem reason", () => {
    expect(() =>
      requestRefundInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        orderId: cuid,
        reason: "",
      }),
    ).toThrow();
  });
});
