import { describe, expect, it } from "vitest";
import {
  DEMO_PHARMACY_SETTLEMENTS,
  pendingSettlementTotals,
  SETTLEMENT_STATUS_KEY,
  settlementBalance,
  settlementStatusBadgeVariant,
} from "./pharmacy-finance";

describe("pharmacy-finance — reconciliação", () => {
  it("fixtures estão reconciliados (comissão + líquido + reserva = bruto)", () => {
    for (const settlement of DEMO_PHARMACY_SETTLEMENTS) {
      const balance = settlementBalance(settlement);
      expect(balance.reconciled).toBe(true);
      expect(balance.accountedMinor).toBe(settlement.grossMinor);
      expect(balance.deltaMinor).toBe(0);
    }
  });

  it("deteta desvio quando não reconciliado", () => {
    const unbalanced = {
      ...DEMO_PHARMACY_SETTLEMENTS[0]!,
      grossMinor: 999999,
    };
    if (unbalanced === undefined) {
      throw new Error("fixtures vazios");
    }
    const balance = settlementBalance(unbalanced);
    expect(balance.reconciled).toBe(false);
    expect(balance.deltaMinor).toBeGreaterThan(0);
  });
});

describe("pharmacy-finance — pendentes", () => {
  it("soma apenas settlements PENDING", () => {
    const totals = pendingSettlementTotals(DEMO_PHARMACY_SETTLEMENTS);
    const expected = DEMO_PHARMACY_SETTLEMENTS.filter(
      (s) => s.status === "PENDING",
    ).reduce((sum, s) => sum + s.netMinor, 0);
    expect(totals.count).toBe(2);
    expect(totals.netMinor).toBe(expected);
  });
});

describe("pharmacy-finance — mapas", () => {
  it("SETTLEMENT_STATUS_KEY cobre os três estados", () => {
    expect(Object.keys(SETTLEMENT_STATUS_KEY).sort()).toEqual([
      "FAILED",
      "PAID",
      "PENDING",
    ]);
  });

  it("mapeia variantes do Badge", () => {
    expect(settlementStatusBadgeVariant("PAID")).toBe("default");
    expect(settlementStatusBadgeVariant("PENDING")).toBe("secondary");
    expect(settlementStatusBadgeVariant("FAILED")).toBe("destructive");
  });
});
