import { describe, expect, it } from "vitest";
import {
  categorySchema,
  countryProductSchema,
  marketOfferSchema,
  searchCatalogInputSchema,
} from "./catalog.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";

const category = {
  id: cuid,
  name: "Analgésicos",
  slug: "analgesicos",
  marketCode: "ao",
  createdAt: new Date(),
};

describe("catalog schemas", () => {
  it("aceita categoria válida e normaliza marketCode", () => {
    const parsed = categorySchema.parse(category);
    expect(parsed.marketCode).toBe("AO");
    expect(parsed.active).toBe(true);
  });

  it("rejeita category sem marketCode", () => {
    const { marketCode: _omit, ...rest } = category;
    expect(() => categorySchema.parse(rest)).toThrow();
  });

  it("rejeita category com slug inválido", () => {
    expect(() =>
      categorySchema.parse({ ...category, slug: "Analgésicos!" }),
    ).toThrow();
  });

  it("marca countryProduct como disponível por defeito", () => {
    const parsed = countryProductSchema.parse({
      id: cuid,
      globalProductId: cuid,
      countryCode: "AO",
      marketCode: "AO",
      name: "Paracetamol 500mg",
      createdAt: new Date(),
    });
    expect(parsed.availability).toBe("AVAILABLE");
    expect(parsed.prescriptionRequired).toBe(false);
  });

  it("valida marketOffer com preço em minor units", () => {
    const parsed = marketOfferSchema.parse({
      id: cuid,
      organizationId: uuid,
      marketCode: "AO",
      pharmacyId: cuid,
      productId: cuid,
      priceMoney: { amount: 1250, currency: "AOA" },
      stock: 10,
    });
    expect(parsed.priceMoney.currency).toBe("AOA");
    expect(parsed.status).toBe("ACTIVE");
  });

  it("rejeita marketOffer com stock negativo", () => {
    expect(() =>
      marketOfferSchema.parse({
        id: cuid,
        organizationId: uuid,
        marketCode: "AO",
        pharmacyId: cuid,
        productId: cuid,
        priceMoney: { amount: 1250, currency: "AOA" },
        stock: -1,
      }),
    ).toThrow();
  });

  it("aplica defaults de paginação na pesquisa de catálogo", () => {
    const parsed = searchCatalogInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
    });
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it("rejeita minPrice negativo na pesquisa", () => {
    expect(() =>
      searchCatalogInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        minPrice: -5,
      }),
    ).toThrow();
  });
});
