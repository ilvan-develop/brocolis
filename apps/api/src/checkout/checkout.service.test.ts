import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { CartService } from "../cart/cart.service.js";
import { CatalogService } from "../catalog/catalog.service.js";
import { OrdersService } from "../orders/orders.service.js";
import {
  CheckoutService,
  computeDeliveryFee,
  computeOrderTotals,
  DEFAULT_DELIVERY_FEES,
} from "./checkout.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const PH_A = "c1234567890abcdef00000001";
const PH_B = "c1234567890abcdef00000002";
const P_PARACETAMOL = "c1234567890abcdef00000021";

const base = { organizationId: ORG, marketCode: "AO" };

function seedCart(cart: CartService, sessionId: string) {
  cart.add(sessionId, {
    ...base,
    productId: P_PARACETAMOL,
    pharmacyId: PH_A,
    quantity: 1,
  });
  cart.add(sessionId, {
    ...base,
    productId: P_PARACETAMOL,
    pharmacyId: PH_B,
    quantity: 2,
  });
  return cart.get(sessionId, base);
}

describe("computeOrderTotals (cálculo puro)", () => {
  it("soma subtotal com preço×quantidade (sem floats)", () => {
    const totals = computeOrderTotals(
      [
        { unitPriceMinor: 250, quantity: 1 },
        { unitPriceMinor: 270, quantity: 2 },
      ],
      2500,
    );
    expect(totals.subtotalMinor).toBe(790);
    expect(totals.totalMinor).toBe(3290);
  });

  it("usa fee flat quando não há zona", () => {
    expect(computeDeliveryFee(undefined)).toBe(DEFAULT_DELIVERY_FEES.flatFee);
  });

  it("usa fee da zona urbana", () => {
    expect(computeDeliveryFee("urban")).toBe(1500);
  });

  it("faz fallback para flat quando a zona é desconhecida", () => {
    expect(computeDeliveryFee("rural")).toBe(DEFAULT_DELIVERY_FEES.flatFee);
  });

  it("nunca devolve total negativo com desconto", () => {
    const totals = computeOrderTotals(
      [{ unitPriceMinor: 100, quantity: 1 }],
      0,
      500,
    );
    expect(totals.totalMinor).toBe(0);
  });
});

describe("CheckoutService.createOrder", () => {
  const catalogService = new CatalogService();

  function setup() {
    const cart = new CartService(catalogService);
    const orders = new OrdersService();
    const checkout = new CheckoutService(cart, orders);
    return { cart, orders, checkout };
  }

  it("cria order PENDING com totals corretos", () => {
    const { cart, checkout } = setup();
    const cartRecord = seedCart(cart, "ck1");
    const order = checkout.createOrder(cartRecord, {
      ...base,
      customerId: "cust-1",
    });
    expect(order.status).toBe("PENDING");
    expect(order.summary.subtotalMinor).toBe(790);
    expect(order.summary.deliveryFeeMinor).toBe(DEFAULT_DELIVERY_FEES.flatFee);
    expect(order.summary.totalMinor).toBe(790 + DEFAULT_DELIVERY_FEES.flatFee);
    expect(order.items).toHaveLength(2);
  });

  it("aplica fee por zona de entrega do endereço", () => {
    const { cart, checkout } = setup();
    const cartRecord = seedCart(cart, "ck2");
    const order = checkout.createOrder(cartRecord, {
      ...base,
      deliveryAddress: { zone: "urban", addressLine: "Rua A" },
    });
    expect(order.summary.deliveryFeeMinor).toBe(1500);
    expect(order.summary.totalMinor).toBe(790 + 1500);
  });

  it("é idempotente pela idempotencyKey", () => {
    const { cart, checkout } = setup();
    const cartRecord = seedCart(cart, "ck3");
    const first = checkout.createOrder(cartRecord, {
      ...base,
      idempotencyKey: "idem-ck-00000001",
    });
    const second = checkout.createOrder(cartRecord, {
      ...base,
      idempotencyKey: "idem-ck-00000001",
    });
    expect(second.id).toBe(first.id);
  });

  it("rejeita carrinho vazio", () => {
    const { cart, checkout } = setup();
    const empty = cart.get("ck4", base);
    expect(() =>
      checkout.createOrder(empty, {
        ...base,
        idempotencyKey: "idem-ck-00000002",
      }),
    ).toThrowError(BadRequestException);
  });

  it("rejeita mismatch entre carrinho e scope", () => {
    const { cart, checkout } = setup();
    const cartRecord = seedCart(cart, "ck5");
    expect(() =>
      checkout.createOrder(cartRecord, {
        organizationId: "11111111-1111-4111-8111-111111111111",
        marketCode: "AO",
        idempotencyKey: "idem-ck-00000003",
      }),
    ).toThrowError(BadRequestException);
  });

  it("regista Auditoria em ordem cronológica", () => {
    const { cart, checkout } = setup();
    const cartRecord = seedCart(cart, "ck6");
    checkout.createOrder(cartRecord, {
      ...base,
      idempotencyKey: "idem-ck-00000004",
    });
    expect(
      checkout.getAuditEvents().some((a) => a.action === "order.created"),
    ).toBe(true);
  });
});
