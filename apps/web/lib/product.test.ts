import type { MarketOffer } from "@brocolis/contracts";
import { describe, expect, it } from "vitest";
import {
  LOW_STOCK_THRESHOLD,
  lowestPriceOf,
  mapOfferToDisplay,
  offersForProduct,
  STOCK_TIER_KEY,
  stockBadgeVariant,
  stockTier,
} from "./product";

const ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";

function offer(overrides: Partial<MarketOffer> = {}): MarketOffer {
  return {
    id: "c10000000000000000000001",
    organizationId: ORGANIZATION_ID,
    marketCode: "AO",
    pharmacyId: "c20000000000000000000001",
    productId: "c30000000000000000000001",
    priceMoney: { amount: 1250, currency: "AOA" },
    stock: 12,
    prescriptionRequired: false,
    status: "ACTIVE",
    ...overrides,
  };
}

describe("product — stock tiers", () => {
  it("define limiar LOW_STOCK_THRESHOLD = 5", () => {
    expect(LOW_STOCK_THRESHOLD).toBe(5);
  });

  it("classifica stock por quantidade", () => {
    expect(stockTier(0)).toBe("out_of_stock");
    expect(stockTier(1)).toBe("low_stock");
    expect(stockTier(5)).toBe("low_stock");
    expect(stockTier(6)).toBe("in_stock");
    expect(stockTier(999)).toBe("in_stock");
  });

  it("mapeia tier para chave i18n", () => {
    expect(STOCK_TIER_KEY.in_stock).toBe("commerce.stock.available");
    expect(STOCK_TIER_KEY.low_stock).toBe("commerce.stock.low");
    expect(STOCK_TIER_KEY.out_of_stock).toBe("commerce.stock.out");
  });

  it("mapeia tier para variante do Badge", () => {
    expect(stockBadgeVariant("in_stock")).toBe("default");
    expect(stockBadgeVariant("low_stock")).toBe("secondary");
    expect(stockBadgeVariant("out_of_stock")).toBe("destructive");
  });
});

describe("product — offer to display", () => {
  it("converte oferta ACTIVE para display com preço formatado", () => {
    const display = mapOfferToDisplay(offer());
    expect(display.offerId).toBe("c10000000000000000000001");
    expect(display.priceLabel).toBe("1 250 Kz");
    expect(display.available).toBe(true);
    expect(display.tier).toBe("in_stock");
  });

  it("out-of-stock fica indisponível mesmo com stock", () => {
    const display = mapOfferToDisplay(
      offer({ status: "OUT_OF_STOCK", stock: 3 }),
    );
    expect(display.available).toBe(false);
    expect(display.tier).toBe("out_of_stock");
  });

  it("stock zerado fica indisponível em oferta ACTIVE", () => {
    const display = mapOfferToDisplay(offer({ stock: 0 }));
    expect(display.available).toBe(false);
    expect(display.tier).toBe("out_of_stock");
  });

  it("oferece dados protegidos por receita", () => {
    const display = mapOfferToDisplay(offer({ prescriptionRequired: true }));
    expect(display.prescriptionRequired).toBe(true);
  });
});

describe("product — lowest price", () => {
  it("devolve null sem ofertas", () => {
    expect(lowestPriceOf([])).toBeNull();
  });

  it("ignora ofertas out-of-stock", () => {
    const offers = [
      offer({
        id: "c10000000000000000000001",
        status: "OUT_OF_STOCK",
        priceMoney: { amount: 1, currency: "AOA" },
      }),
      offer({
        id: "c10000000000000000000002",
        priceMoney: { amount: 2500, currency: "AOA" },
      }),
    ];
    expect(lowestPriceOf(offers)).toEqual({ amount: 2500, currency: "AOA" });
  });

  it("escolhe o preço mais baixo", () => {
    const offers = [
      offer({
        id: "c10000000000000000000001",
        priceMoney: { amount: 3000, currency: "AOA" },
      }),
      offer({
        id: "c10000000000000000000002",
        priceMoney: { amount: 1200, currency: "AOA" },
      }),
      offer({
        id: "c10000000000000000000003",
        priceMoney: { amount: 2400, currency: "AOA" },
      }),
    ];
    expect(lowestPriceOf(offers)).toEqual({ amount: 1200, currency: "AOA" });
  });
});

describe("product — ofertas por produto", () => {
  it("filtra ofertas de um produto", () => {
    const offers = [
      offer({
        id: "c10000000000000000000001",
        productId: "c30000000000000000000001",
      }),
      offer({
        id: "c10000000000000000000002",
        productId: "c30000000000000000000002",
      }),
    ];
    const result = offersForProduct(offers, "c30000000000000000000001");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("c10000000000000000000001");
  });

  it("produto sem ofertas devolve lista vazia", () => {
    expect(offersForProduct([], "c30000000000000000000009")).toHaveLength(0);
  });
});
