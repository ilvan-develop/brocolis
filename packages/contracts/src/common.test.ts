import { describe, expect, it } from "vitest";
import { listMarketOffersInputSchema } from "./catalog.js";
import {
  marketCodeSchema,
  moneySchema,
  organizationIdSchema,
} from "./common.js";

describe("common schemas", () => {
  it("aceita marketCode válido e normaliza para maiúsculas", () => {
    expect(marketCodeSchema.parse("ao")).toBe("AO");
  });

  it("rejeita marketCode inválido", () => {
    expect(() => marketCodeSchema.parse("AO!")).toThrow();
  });

  it("valida money com moeda de 3 letras", () => {
    expect(moneySchema.parse({ amount: 12500, currency: "AOA" }).currency).toBe(
      "AOA",
    );
  });

  it("rejeita organizationId que não seja UUID", () => {
    expect(() => organizationIdSchema.parse("123")).toThrow();
  });
});

describe("catalog contract", () => {
  it("aplica defaults em listMarketOffers", () => {
    const input = listMarketOffersInputSchema.parse({
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    });
    expect(input.limit).toBe(20);
  });
});
