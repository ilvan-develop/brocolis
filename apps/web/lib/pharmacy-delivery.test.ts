import { describe, expect, it } from "vitest";
import {
  DELIVERY_STATUS_KEY,
  DEMO_PHARMACY_DELIVERIES,
  deliveryEtaLabel,
  deliveryStatusBadgeVariant,
} from "./pharmacy-delivery";

describe("pharmacy-delivery — ETA", () => {
  it("abaixo da hora usa minutos", () => {
    expect(deliveryEtaLabel(45)).toBe("45 min");
  });

  it("hora cheia", () => {
    expect(deliveryEtaLabel(60)).toBe("1 h");
    expect(deliveryEtaLabel(120)).toBe("2 h");
  });

  it("hora e minutos", () => {
    expect(deliveryEtaLabel(75)).toBe("1 h 15 min");
  });
});

describe("pharmacy-delivery — presentação dos estados", () => {
  it("DELIVERY_STATUS_KEY cobre os cinco estados", () => {
    expect(Object.keys(DELIVERY_STATUS_KEY).sort()).toEqual([
      "ASSIGNED",
      "CANCELED",
      "COMPLETED",
      "IN_PROGRESS",
      "SCHEDULED",
    ]);
  });

  it("mapeia variantes do Badge", () => {
    expect(deliveryStatusBadgeVariant("COMPLETED")).toBe("default");
    expect(deliveryStatusBadgeVariant("IN_PROGRESS")).toBe("secondary");
    expect(deliveryStatusBadgeVariant("SCHEDULED")).toBe("secondary");
    expect(deliveryStatusBadgeVariant("ASSIGNED")).toBe("outline");
    expect(deliveryStatusBadgeVariant("CANCELED")).toBe("destructive");
  });
});

describe("pharmacy-delivery — fixtures", () => {
  it("existem entregas pendentes e concluídas", () => {
    expect(DEMO_PHARMACY_DELIVERIES.some((d) => d.status === "SCHEDULED")).toBe(
      true,
    );
    expect(DEMO_PHARMACY_DELIVERIES.some((d) => d.status === "COMPLETED")).toBe(
      true,
    );
  });
});
