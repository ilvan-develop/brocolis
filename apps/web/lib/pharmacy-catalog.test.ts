import { describe, expect, it } from "vitest";
import {
  DEMO_PHARMACY_CATALOG,
  filterPharmacyCatalog,
  totalCatalogValue,
  updateCatalogPrice,
} from "./pharmacy-catalog";

describe("pharmacy-catalog", () => {
  it("filtra por nome, marca e apresentação", () => {
    expect(
      filterPharmacyCatalog(DEMO_PHARMACY_CATALOG, "amoxicilina"),
    ).toHaveLength(1);
    expect(
      filterPharmacyCatalog(DEMO_PHARMACY_CATALOG, "zitromax"),
    ).toHaveLength(1);
    expect(
      filterPharmacyCatalog(DEMO_PHARMACY_CATALOG, "cápsulas").length,
    ).toBe(1);
    expect(
      filterPharmacyCatalog(DEMO_PHARMACY_CATALOG, "inexistente"),
    ).toHaveLength(0);
  });

  it("query vazia devolve cópia completa", () => {
    const result = filterPharmacyCatalog(DEMO_PHARMACY_CATALOG, "   ");
    expect(result).toHaveLength(DEMO_PHARMACY_CATALOG.length);
    expect(result).toEqual(DEMO_PHARMACY_CATALOG);
    expect(result).not.toBe(DEMO_PHARMACY_CATALOG);
  });

  it("atualiza o preço de um produto preservando os restantes", () => {
    const target = DEMO_PHARMACY_CATALOG[0]!;
    const updated = updateCatalogPrice(
      DEMO_PHARMACY_CATALOG,
      target.productId,
      7000,
    );
    const changed = updated.find((item) => item.productId === target.productId);
    expect(changed?.price.amount).toBe(7000);
    expect(changed?.price.currency).toBe(target.price.currency);
    expect(updated).toHaveLength(DEMO_PHARMACY_CATALOG.length);
    for (const item of updated) {
      if (item.productId !== target.productId) {
        expect(item.price.amount).toBe(
          DEMO_PHARMACY_CATALOG.find(
            (original) => original.productId === item.productId,
          )?.price.amount,
        );
      }
    }
  });

  it("totalCatalogValue soma preço × stock", () => {
    const expected = DEMO_PHARMACY_CATALOG.reduce(
      (sum, item) => sum + item.price.amount * Math.max(item.stock, 0),
      0,
    );
    expect(totalCatalogValue(DEMO_PHARMACY_CATALOG)).toBe(expected);
    expect(totalCatalogValue([])).toBe(0);
  });
});
