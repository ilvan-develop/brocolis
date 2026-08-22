import { describe, expect, it } from "vitest";
import {
  canActOnPrescription,
  DEMO_PHARMACY_PRESCRIPTIONS,
  PRESCRIPTION_STATUS_KEY,
  prescriptionCounts,
  prescriptionStatusBadgeVariant,
  respondToPrescription,
  totalPending,
} from "./pharmacy-prescriptions";

describe("pharmacy-prescriptions — contagens", () => {
  it("conta por estado nos fixtures", () => {
    const counts = prescriptionCounts(DEMO_PHARMACY_PRESCRIPTIONS);
    expect(counts).toEqual({
      pending: 2,
      responseRequired: 1,
      approved: 2,
      rejected: 1,
      expired: 1,
    });
  });

  it("totalPending soma pendentes e resposta necessária", () => {
    expect(totalPending(prescriptionCounts(DEMO_PHARMACY_PRESCRIPTIONS))).toBe(
      3,
    );
  });
});

describe("pharmacy-prescriptions — acções", () => {
  it("só se pode agir em pendentes ou resposta necessária", () => {
    expect(canActOnPrescription("PENDING")).toBe(true);
    expect(canActOnPrescription("RESPONSE_REQUIRED")).toBe(true);
    expect(canActOnPrescription("APPROVED")).toBe(false);
    expect(canActOnPrescription("REJECTED")).toBe(false);
    expect(canActOnPrescription("EXPIRED")).toBe(false);
  });

  it("respondToPrescription altera estado e notas sem mutar o original", () => {
    const original = DEMO_PHARMACY_PRESCRIPTIONS[0];
    if (original === undefined) {
      throw new Error("fixtures vazios");
    }
    const responded = respondToPrescription(
      original,
      "REJECTED",
      "Sem receita digital",
    );
    expect(responded.id).toBe(original.id);
    expect(responded.status).toBe("REJECTED");
    expect(responded.pharmacistNotes).toBe("Sem receita digital");
    expect(original.status).toBe("PENDING");
  });
});

describe("pharmacy-prescriptions — mapas", () => {
  it("PRESCRIPTION_STATUS_KEY cobre os cinco estados", () => {
    expect(Object.keys(PRESCRIPTION_STATUS_KEY).sort()).toEqual([
      "APPROVED",
      "EXPIRED",
      "PENDING",
      "REJECTED",
      "RESPONSE_REQUIRED",
    ]);
  });

  it("mapeia variantes do Badge", () => {
    expect(prescriptionStatusBadgeVariant("APPROVED")).toBe("default");
    expect(prescriptionStatusBadgeVariant("PENDING")).toBe("secondary");
    expect(prescriptionStatusBadgeVariant("RESPONSE_REQUIRED")).toBe(
      "secondary",
    );
    expect(prescriptionStatusBadgeVariant("REJECTED")).toBe("destructive");
    expect(prescriptionStatusBadgeVariant("EXPIRED")).toBe("destructive");
  });
});
