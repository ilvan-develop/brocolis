import { describe, expect, it } from "vitest";
import {
  addToCartInputSchema,
  cartItemSchema,
  cartSchema,
  getCartInputSchema,
} from "./cart.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";

describe("cart schemas", () => {
  it("valida addToCart com org+market", () => {
    const parsed = addToCartInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      productId: cuid,
      pharmacyId: cuid,
      quantity: 2,
    });
    expect(parsed.quantity).toBe(2);
  });

  it("rejeita addToCart sem organizationId", () => {
    expect(() =>
      addToCartInputSchema.parse({
        marketCode: "AO",
        productId: cuid,
        pharmacyId: cuid,
        quantity: 1,
      }),
    ).toThrow();
  });

  it("rejeita quantidade zero", () => {
    expect(() =>
      addToCartInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        productId: cuid,
        pharmacyId: cuid,
        quantity: 0,
      }),
    ).toThrow();
  });

  it("valida cartItem com unitPrice money", () => {
    const parsed = cartItemSchema.parse({
      productId: cuid,
      pharmacyId: cuid,
      quantity: 3,
      unitPrice: { amount: 250, currency: "AOA" },
    });
    expect(parsed.unitPrice.amount).toBe(250);
  });

  it("valida cart completo multi-item", () => {
    const parsed = cartSchema.parse({
      id: cuid,
      sessionId: "sess-1",
      organizationId: uuid,
      marketCode: "AO",
      items: [
        {
          productId: cuid,
          pharmacyId: cuid,
          quantity: 1,
          unitPrice: { amount: 100, currency: "AOA" },
        },
        {
          productId: cuid,
          pharmacyId: cuid,
          quantity: 2,
          unitPrice: { amount: 200, currency: "AOA" },
        },
      ],
      subtotal: { amount: 500, currency: "AOA" },
      itemCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(parsed.items).toHaveLength(2);
    expect(parsed.itemCount).toBe(3);
  });

  it("rejeita cart com itemCount negativo", () => {
    expect(() =>
      cartSchema.parse({
        id: cuid,
        sessionId: "sess-1",
        organizationId: uuid,
        marketCode: "AO",
        items: [],
        subtotal: { amount: 0, currency: "AOA" },
        itemCount: -1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it("getCart exige scope tenant+mercado e normaliza marketCode", () => {
    const parsed = getCartInputSchema.parse({
      organizationId: uuid,
      marketCode: "ao",
    });
    expect(parsed.marketCode).toBe("AO");
  });
});
