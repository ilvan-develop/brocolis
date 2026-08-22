import type { CartItem, MarketOffer } from "@brocolis/contracts";
import { describe, expect, it } from "vitest";
import {
  addToCart,
  clampQuantity,
  computeSubtotal,
  MAX_ITEM_QUANTITY,
  MIN_ITEM_QUANTITY,
  removeFromCart,
} from "./cart";
import { matchesQuery } from "./catalog";
import { mapOfferToDisplay, stockBadgeVariant, stockTier } from "./product";
import { bestOffer, distinctPharmacyIds } from "./storefront";
import { deserializeCart, serializeCart } from "./storefront-cart";

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

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "c30000000000000000000001",
    pharmacyId: "c20000000000000000000001",
    quantity: 1,
    unitPrice: { amount: 1250, currency: "AOA" },
    ...overrides,
  };
}

describe("storefront — stock tiers", () => {
  it("classifica stock por quantidade", () => {
    expect(stockTier(0)).toBe("out_of_stock");
    expect(stockTier(5)).toBe("low_stock");
    expect(stockTier(6)).toBe("in_stock");
  });

  it("mapeia tier para variante do badge", () => {
    expect(stockBadgeVariant("in_stock")).toBe("default");
    expect(stockBadgeVariant("low_stock")).toBe("secondary");
    expect(stockBadgeVariant("out_of_stock")).toBe("destructive");
  });
});

describe("storefront — oferta para display", () => {
  it("converte oferta ACTIVE com preço formatado", () => {
    const display = mapOfferToDisplay(offer());
    expect(display.priceLabel).toBe("1 250 Kz");
    expect(display.available).toBe(true);
    expect(display.tier).toBe("in_stock");
  });

  it("oferece aviso de receita quando exigida", () => {
    const display = mapOfferToDisplay(offer({ prescriptionRequired: true }));
    expect(display.prescriptionRequired).toBe(true);
  });
});

describe("storefront — pesquisa", () => {
  it("casa por fragmento ignorando acentos", () => {
    expect(
      matchesQuery(["Paracetamol 500mg", "LabAngola"], "pAraCetaMOL"),
    ).toBe(true);
    expect(matchesQuery(["Ácido Fólico"], "acido")).toBe(true);
  });

  it("query vazia casa sempre", () => {
    expect(matchesQuery(["qualquer"], "")).toBe(true);
    expect(matchesQuery([], "   ")).toBe(true);
  });
});

describe("storefront — carrinho em memória", () => {
  it("clamp respeita mínimos e máximos", () => {
    expect(clampQuantity(0)).toBe(MIN_ITEM_QUANTITY);
    expect(clampQuantity(1500)).toBe(MAX_ITEM_QUANTITY);
    expect(clampQuantity(1.6)).toBe(2);
  });

  it("addToCart agrega pela mesma chave productId+pharmacyId", () => {
    const result = addToCart([item({ quantity: 2 })], item({ quantity: 3 }));
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(5);
  });

  it("removeItem filtra pela chave", () => {
    const baseline = [item(), item({ productId: "c30000000000000000000002" })];
    const result = removeFromCart(
      baseline,
      "c30000000000000000000001",
      "c20000000000000000000001",
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe("c30000000000000000000002");
  });

  it("computeSubtotal soma por quantidade", () => {
    const items = [
      item({ quantity: 2, unitPrice: { amount: 1250, currency: "AOA" } }),
      item({
        productId: "c30000000000000000000002",
        unitPrice: { amount: 500, currency: "AOA" },
      }),
    ];
    expect(computeSubtotal(items)).toEqual({ amount: 3000, currency: "AOA" });
  });
});

describe("storefront — bestOffer", () => {
  it("escolhe a oferta disponível mais barata", () => {
    const offers = [
      offer({
        id: "c10000000000000000000001",
        priceMoney: { amount: 3000, currency: "AOA" },
      }),
      offer({
        id: "c10000000000000000000002",
        priceMoney: { amount: 1200, currency: "AOA" },
      }),
    ];
    expect(bestOffer(offers)?.id).toBe("c10000000000000000000002");
  });

  it("ignora ofertas out-of-stock e com stock zero", () => {
    const offers = [
      offer({ id: "c10000000000000000000001", status: "OUT_OF_STOCK" }),
      offer({ id: "c10000000000000000000002", stock: 0 }),
    ];
    expect(bestOffer(offers)).toBeNull();
  });

  it("devolve null sem ofertas", () => {
    expect(bestOffer([])).toBeNull();
  });
});

describe("storefront — farmácias distintas", () => {
  it("extrai pharmacyIds únicos dos itens", () => {
    const items = [
      item(),
      item({ pharmacyId: "c20000000000000000000002" }),
      item({
        pharmacyId: "c20000000000000000000002",
        productId: "c30000000000000000000009",
      }),
    ];
    expect(distinctPharmacyIds(items)).toEqual([
      "c20000000000000000000001",
      "c20000000000000000000002",
    ]);
  });
});

describe("storefront — persistência do carrinho", () => {
  it("round-trip de serialize/deserialize preserva os itens", () => {
    const items = [item({ quantity: 3 })];
    const restored = deserializeCart(serializeCart(items));
    expect(restored).toEqual(items);
  });

  it("rejeita payloads inválidos", () => {
    expect(deserializeCart(null)).toEqual([]);
    expect(deserializeCart("")).toEqual([]);
    expect(deserializeCart("{")).toEqual([]);
    expect(deserializeCart('{"a":1}')).toEqual([]);
  });

  it("filtra entradas malformadas mantendo as válidas", () => {
    const raw = JSON.stringify([
      item(),
      { productId: "c30000000000000000000002" },
    ]);
    const restored = deserializeCart(raw);
    expect(restored).toHaveLength(1);
    expect(restored[0]?.productId).toBe("c30000000000000000000001");
  });
});
