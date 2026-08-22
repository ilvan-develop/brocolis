import type { Cart, CartItem } from "@brocolis/contracts";
import { describe, expect, it } from "vitest";
import {
  addToCart,
  canCheckout,
  clampQuantity,
  computeItemCount,
  computeSubtotal,
  itemKey,
  MAX_ITEM_QUANTITY,
  MIN_ITEM_QUANTITY,
  removeFromCart,
  updateQuantity,
} from "./cart";

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "c30000000000000000000001",
    pharmacyId: "c20000000000000000000001",
    quantity: 1,
    unitPrice: { amount: 1250, currency: "AOA" },
    ...overrides,
  };
}

function cart(items: CartItem[]): Cart {
  return {
    id: "c10000000000000000000001",
    sessionId: "sessao-1",
    organizationId: "00000000-0000-4000-8000-000000000001",
    marketCode: "AO",
    items,
    subtotal: computeSubtotal(items),
    itemCount: computeItemCount(items),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("cart — clamp de quantidade", () => {
  it("respeita mínimo e máximo", () => {
    expect(clampQuantity(0)).toBe(MIN_ITEM_QUANTITY);
    expect(clampQuantity(1)).toBe(1);
    expect(clampQuantity(1500)).toBe(MAX_ITEM_QUANTITY);
  });

  it("arredonda valores fracionários", () => {
    expect(clampQuantity(1.6)).toBe(2);
    expect(clampQuantity(2.4)).toBe(2);
  });

  it("rejeita valores não finitos", () => {
    expect(clampQuantity(Number.NaN)).toBe(MIN_ITEM_QUANTITY);
    expect(clampQuantity(Number.POSITIVE_INFINITY)).toBe(MIN_ITEM_QUANTITY);
  });

  it("aceita um máximo personalizado", () => {
    expect(clampQuantity(30, 10)).toBe(10);
    expect(clampQuantity(5, 10)).toBe(5);
  });
});

describe("cart — itemKey e agregações", () => {
  it("chave combina productId e pharmacyId", () => {
    expect(itemKey({ productId: "a", pharmacyId: "b" })).toBe("a:b");
  });

  it("subtotal soma por quantidade", () => {
    const items = [
      item({ quantity: 2, unitPrice: { amount: 1250, currency: "AOA" } }),
      item({
        productId: "c30000000000000000000002",
        quantity: 1,
        unitPrice: { amount: 500, currency: "AOA" },
      }),
    ];
    expect(computeSubtotal(items)).toEqual({ amount: 3000, currency: "AOA" });
  });

  it("subtotal vazio usa AOA como fallback", () => {
    expect(computeSubtotal([])).toEqual({ amount: 0, currency: "AOA" });
  });

  it("itemCount soma as unidades", () => {
    const items = [
      item({ quantity: 3 }),
      item({ productId: "c30000000000000000000002", quantity: 2 }),
    ];
    expect(computeItemCount(items)).toBe(5);
  });
});

describe("cart — mutações (mirror cliente)", () => {
  it("adiciona item novo", () => {
    const result = addToCart([], item());
    expect(result).toHaveLength(1);
  });

  it("agrega a mesma chave productId+pharmacyId", () => {
    const result = addToCart([item({ quantity: 2 })], item({ quantity: 3 }));
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(5);
  });

  it("trata produtos iguais em farmácias diferentes como itens distintos", () => {
    const result = addToCart(
      [item()],
      item({ pharmacyId: "c20000000000000000000002" }),
    );
    expect(result).toHaveLength(2);
  });

  it("remove um item pela chave", () => {
    const baseline = [
      item(),
      item({
        productId: "c30000000000000000000002",
        pharmacyId: "c20000000000000000000002",
      }),
    ];
    const result = removeFromCart(
      baseline,
      "c30000000000000000000001",
      "c20000000000000000000001",
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe("c30000000000000000000002");
  });

  it("atualiza quantidade com limite máximo", () => {
    const result = updateQuantity(
      [item({ quantity: 1 })],
      "c30000000000000000000001",
      "c20000000000000000000001",
      2000,
    );
    expect(result[0]?.quantity).toBe(MAX_ITEM_QUANTITY);
  });

  it("atualização não afeta outros itens", () => {
    const baseline = [
      item(),
      item({ productId: "c30000000000000000000002", quantity: 4 }),
    ];
    const result = updateQuantity(
      baseline,
      "c30000000000000000000002",
      "c20000000000000000000001",
      7,
    );
    expect(result[0]?.quantity).toBe(1);
    expect(result[1]?.quantity).toBe(7);
  });

  it("canCheckout exige itens e subtotal positivo", () => {
    expect(canCheckout(cart([]))).toBe(false);
    expect(canCheckout(cart([item({ quantity: 1 })]))).toBe(true);
  });
});
