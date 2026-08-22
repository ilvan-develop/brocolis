import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { CatalogService } from "../catalog/catalog.service.js";
import { CartService } from "./cart.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const PH_A = "c1234567890abcdef00000001";
const PH_B = "c1234567890abcdef00000002";
const P_PARACETAMOL = "c1234567890abcdef00000021";

const base = { organizationId: ORG, marketCode: "AO" };

describe("CartService", () => {
  const catalog = new CatalogService();

  it("adiciona item com preço do catálogo e recalcula total", () => {
    const cart = new CartService(catalog);
    const result = cart.add("s1", {
      ...base,
      productId: P_PARACETAMOL,
      pharmacyId: PH_A,
      quantity: 2,
    });
    expect(result.items[0]?.unitPriceMinor).toBe(250);
    expect(result.items[0]?.lineTotalMinor).toBe(500);
    expect(result.subtotalMinor).toBe(500);
    expect(result.itemCount).toBe(2);
  });

  it("soma itens de farmácias diferentes (multi-farmácia)", () => {
    const cart = new CartService(catalog);
    cart.add("s2", {
      ...base,
      productId: P_PARACETAMOL,
      pharmacyId: PH_A,
      quantity: 1,
    });
    const result = cart.add("s2", {
      ...base,
      productId: P_PARACETAMOL,
      pharmacyId: PH_B,
      quantity: 2,
    });
    expect(result.items).toHaveLength(2);
    expect(result.subtotalMinor).toBe(250 + 270 * 2);
    expect(result.itemCount).toBe(3);
  });

  it("acumula quantidade ao re-adicionar o mesmo par produto+farmácia", () => {
    const cart = new CartService(catalog);
    cart.add("s3", {
      ...base,
      productId: P_PARACETAMOL,
      pharmacyId: PH_A,
      quantity: 1,
    });
    const result = cart.add("s3", {
      ...base,
      productId: P_PARACETAMOL,
      pharmacyId: PH_A,
      quantity: 2,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.quantity).toBe(3);
    expect(result.subtotalMinor).toBe(750);
  });

  it("atualiza quantidade e recalcula subtotal", () => {
    const cart = new CartService(catalog);
    cart.add("s4", {
      ...base,
      productId: P_PARACETAMOL,
      pharmacyId: PH_A,
      quantity: 2,
    });
    const result = cart.update("s4", {
      ...base,
      productId: P_PARACETAMOL,
      pharmacyId: PH_A,
      quantity: 5,
    });
    expect(result.items[0]?.quantity).toBe(5);
    expect(result.subtotalMinor).toBe(1250);
  });

  it("remove item e zera subtotal quando fica vazio", () => {
    const cart = new CartService(catalog);
    cart.add("s5", {
      ...base,
      productId: P_PARACETAMOL,
      pharmacyId: PH_A,
      quantity: 3,
    });
    const result = cart.remove("s5", {
      ...base,
      productId: P_PARACETAMOL,
      pharmacyId: PH_A,
    });
    expect(result.items).toHaveLength(0);
    expect(result.subtotalMinor).toBe(0);
    expect(result.itemCount).toBe(0);
  });

  it("isola carrinhos por sessão (mesmo tenant+mercado)", () => {
    const cart = new CartService(catalog);
    cart.add("a", {
      ...base,
      productId: P_PARACETAMOL,
      pharmacyId: PH_A,
      quantity: 1,
    });
    const empty = cart.get("b", base);
    expect(empty.items).toHaveLength(0);
    expect(empty.subtotalMinor).toBe(0);
  });

  it("lança NotFound ao atualizar item fora do carrinho", () => {
    const cart = new CartService(catalog);
    expect(() =>
      cart.update("s6", {
        ...base,
        productId: P_PARACETAMOL,
        pharmacyId: PH_B,
        quantity: 1,
      }),
    ).toThrowError(NotFoundException);
  });
});
