import { describe, expect, it } from "vitest";
import { getMarket, listMarkets } from "./index.js";
import type { Market } from "./types.js";

const MARKET_KEYS = [
  "countryCode",
  "region",
  "locale",
  "currency",
  "phone",
  "address",
  "payments",
  "taxation",
  "pharmacy",
  "prescription",
  "logistics",
] as const;

function assertMarketContract(market: Market) {
  for (const key of MARKET_KEYS) {
    expect(market, `key ${key} ausente`).toHaveProperty(key);
  }
}

describe("markets", () => {
  it("resolve o Market AO por defeito", () => {
    const ao = getMarket("AO");
    expect(ao.currency).toEqual({
      code: "AOA",
      symbol: "Kz",
      decimals: 0,
      groupSeparator: " ",
    });
    expect(ao.payments.methods.map((m) => m.id)).toContain("multicaixa");
    expect(ao.prescription.validityDays).toBe(30);
  });

  it("é case-insensitive", () => {
    expect(getMarket("ao").countryCode).toBe("AO");
  });

  it("rejeita mercados desconhecidos", () => {
    expect(() => getMarket("XX")).toThrow(/não suportado/);
  });

  it("lista pelo menos o mercado de referência", () => {
    expect(listMarkets().map((m) => m.countryCode)).toContain("AO");
  });
});

describe("markets — Country Packs (F-DS)", () => {
  it("resolve o Market MZ com o contrato completo", () => {
    const mz = getMarket("MZ");
    assertMarketContract(mz);
    expect(mz.currency).toEqual({
      code: "MZN",
      symbol: "MT",
      decimals: 0,
      groupSeparator: ",",
    });
    expect(mz.phone.countryCode).toBe("+258");
    expect(mz.locale).toBe("pt-MZ");
    expect(mz.taxation.vatRate).toBe(17);
    expect(mz.logistics.deliveryUnit).toBe("km");
    expect(mz.payments.methods.map((m) => m.type)).toEqual(
      expect.arrayContaining(["reference", "wallet"]),
    );
  });

  it("resolve o Market KE com o contrato completo", () => {
    const ke = getMarket("KE");
    assertMarketContract(ke);
    expect(ke.currency).toEqual({
      code: "KES",
      symbol: "KSh",
      decimals: 2,
      groupSeparator: ",",
    });
    expect(ke.phone.countryCode).toBe("+254");
    expect(ke.locale).toBe("en-KE");
    expect(ke.taxation.vatRate).toBe(16);
    expect(ke.payments.methods.map((m) => m.type)).toEqual(
      expect.arrayContaining(["wallet", "cod"]),
    );
    expect(ke.payments.methods.map((m) => m.id)).toEqual(
      expect.arrayContaining(["m-pesa", "airtel-money"]),
    );
  });

  it("resolve o Market NG com o contrato completo", () => {
    const ng = getMarket("NG");
    assertMarketContract(ng);
    expect(ng.currency).toEqual({
      code: "NGN",
      symbol: "₦",
      decimals: 2,
      groupSeparator: ",",
    });
    expect(ng.phone.countryCode).toBe("+234");
    expect(ng.locale).toBe("en-NG");
    expect(ng.taxation.vatRate).toBe(7.5);
    expect(ng.payments.methods.map((m) => m.type)).toEqual(
      expect.arrayContaining(["bank", "wallet", "cod"]),
    );
  });

  it("listMarkets inclui os quatro mercados registados", () => {
    expect(listMarkets().map((m) => m.countryCode)).toEqual(
      expect.arrayContaining(["AO", "MZ", "KE", "NG"]),
    );
  });
});
