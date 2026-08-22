import { describe, expect, it } from "vitest";
import {
  availableOf,
  DEMO_PHARMACY_INVENTORY,
  INVENTORY_ALERT_KEY,
  inventoryAlertBadgeVariant,
  inventoryAlertFor,
  inventoryTotals,
  type PharmacyInventoryRow,
  stockPct,
} from "./pharmacy-inventory";

const NOW = new Date("2026-01-15T10:00:00.000Z");
const DAY_MS = 86_400_000;

function row(
  overrides: Partial<PharmacyInventoryRow> = {},
): PharmacyInventoryRow {
  const base = DEMO_PHARMACY_INVENTORY[0];
  if (base === undefined) {
    throw new Error("inventário demo vazio");
  }
  const clone: PharmacyInventoryRow = {
    ...base,
    expiryDate: new Date(base.expiryDate),
  };
  return { ...clone, ...overrides };
}

describe("pharmacy-inventory — alertas", () => {
  it("expirado tem prioridade sobre expirando", () => {
    const expired = row({ expiryDate: new Date(NOW.getTime() - 1) });
    expect(inventoryAlertFor(expired, NOW)).toBe("EXPIRED");
  });

  it("dentro da janela de expiringDays é EXPIRING", () => {
    const expiring = row({ expiryDate: new Date(NOW.getTime() + 30 * DAY_MS) });
    expect(inventoryAlertFor(expiring, NOW)).toBe("EXPIRING");
  });

  it("abaixo do critical é CRITICAL, senão LOW", () => {
    const critical = row({
      quantityOnHand: 2,
      expiryDate: new Date(NOW.getTime() + 365 * DAY_MS),
    });
    expect(inventoryAlertFor(critical, NOW)).toBe("CRITICAL");

    const low = row({
      quantityOnHand: 8,
      expiryDate: new Date(NOW.getTime() + 365 * DAY_MS),
    });
    expect(inventoryAlertFor(low, NOW)).toBe("LOW");
  });

  it("stock saudável não gera alerta", () => {
    const healthy = row({
      quantityOnHand: 50,
      expiryDate: new Date(NOW.getTime() + 365 * DAY_MS),
    });
    expect(inventoryAlertFor(healthy, NOW)).toBeNull();
  });
});

describe("pharmacy-inventory — totais", () => {
  it("outOfStock conta zero de stock", () => {
    const totals = inventoryTotals([row({ quantityOnHand: 0 }), row()], NOW);
    expect(totals.outOfStock).toBe(1);
  });

  it("conta expirados, expirando e stock baixo no conjunto demo", () => {
    const totals = inventoryTotals(DEMO_PHARMACY_INVENTORY, new Date());
    expect(totals.items).toBe(DEMO_PHARMACY_INVENTORY.length);
    expect(totals.expired).toBe(1);
    expect(totals.expiring).toBe(2);
    expect(totals.lowStock).toBe(2);
  });

  it("availableOf nunca é negativo", () => {
    expect(availableOf(row({ quantityOnHand: 5, reserved: 8 }))).toBe(0);
    expect(availableOf(row({ quantityOnHand: 5, reserved: 2 }))).toBe(3);
  });
});

describe("pharmacy-inventory — stockPct", () => {
  it("percentagem de disponível", () => {
    const rows = [
      row({
        quantityOnHand: 10,
        reserved: 2,
        expiryDate: new Date(NOW.getTime() + 365 * DAY_MS),
      }),
      row({
        quantityOnHand: 10,
        reserved: 6,
        expiryDate: new Date(NOW.getTime() + 365 * DAY_MS),
      }),
    ];
    expect(stockPct(rows)).toBe(60);
  });

  it("sem stock devolve 0", () => {
    expect(stockPct([])).toBe(0);
  });
});

describe("pharmacy-inventory — mapa de alertas", () => {
  it("cobre todos os tipos", () => {
    expect(Object.keys(INVENTORY_ALERT_KEY).sort()).toEqual([
      "CRITICAL",
      "EXPIRED",
      "EXPIRING",
      "LOW",
    ]);
  });

  it("mapeia variantes do Badge", () => {
    expect(inventoryAlertBadgeVariant("LOW")).toBe("secondary");
    expect(inventoryAlertBadgeVariant("CRITICAL")).toBe("destructive");
    expect(inventoryAlertBadgeVariant("EXPIRING")).toBe("outline");
    expect(inventoryAlertBadgeVariant("EXPIRED")).toBe("destructive");
  });
});
