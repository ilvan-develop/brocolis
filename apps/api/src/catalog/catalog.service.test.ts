import { describe, expect, it } from "vitest";
import { CatalogService } from "./catalog.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const PH_A = "c1234567890abcdef00000001";
const CAT_ANALGESICOS = "c1234567890abcdef00000011";

describe("CatalogService.search", () => {
  const catalog = new CatalogService();

  it("bloqueia cross-tenant (organização diferente devolve 0)", () => {
    const result = catalog.search({
      organizationId: "11111111-1111-4111-8111-111111111111",
      marketCode: "AO",
    });
    expect(result.total).toBe(0);
  });

  it("devolve só ofertas com stock (disponibilidade)", () => {
    const result = catalog.search({ organizationId: ORG, marketCode: "AO" });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((i) => i.stock > 0)).toBe(true);
  });

  it("exclui ofertas sem stock mesmo com query", () => {
    const result = catalog.search({
      organizationId: ORG,
      marketCode: "AO",
      query: "ibuprofeno",
    });
    expect(result.items).toHaveLength(0);
  });

  it("filtra por intervalo de preço", () => {
    const result = catalog.search({
      organizationId: ORG,
      marketCode: "AO",
      minPrice: 500,
      maxPrice: 1000,
    });
    expect(result.total).toBeGreaterThan(0);
    expect(
      result.items.every((i) => i.priceMinor >= 500 && i.priceMinor <= 1000),
    ).toBe(true);
  });

  it("filtra por farmácia", () => {
    const result = catalog.search({
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH_A,
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((i) => i.pharmacyId === PH_A)).toBe(true);
  });

  it("filtra por categoria", () => {
    const result = catalog.search({
      organizationId: ORG,
      marketCode: "AO",
      categoryId: CAT_ANALGESICOS,
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((i) => i.categoryId === CAT_ANALGESICOS)).toBe(
      true,
    );
  });

  it("faz match de query sem case sensitivity", () => {
    const result = catalog.search({
      organizationId: ORG,
      marketCode: "AO",
      query: "PARACETAMOL",
    });
    expect(result.total).toBe(2);
  });

  it("pagina corretamente e preserva o total", () => {
    const all = catalog.search({ organizationId: ORG, marketCode: "AO" });
    const page1 = catalog.search({
      organizationId: ORG,
      marketCode: "AO",
      page: 1,
      pageSize: 2,
    });
    const page2 = catalog.search({
      organizationId: ORG,
      marketCode: "AO",
      page: 2,
      pageSize: 2,
    });
    expect(page1.items).toHaveLength(2);
    expect(page1.items[0]?.id).not.toBe(page2.items[0]?.id);
    expect(page2.total).toBe(all.total);
  });

  it("getOffer devolve only com stock válido", () => {
    const offer = catalog.getOffer(
      ORG,
      "AO",
      "c1234567890abcdef00000021",
      PH_A,
    );
    expect(offer.priceMinor).toBe(250);
    expect(() =>
      catalog.getOffer(ORG, "AO", "c1234567890abcdef00000022", PH_A),
    ).toThrow(/indisponível/);
  });
});
