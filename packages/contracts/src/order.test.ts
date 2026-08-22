import { describe, expect, it } from "vitest";
import {
  createOrderInputSchema,
  orderItemSchema,
  orderSchema,
  orderStatusEnumSchema,
  orderStatusHistorySchema,
} from "./order.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";

const money = { amount: 1250, currency: "AOA" };

describe("order schemas", () => {
  it("enum de estados contém o ciclo completo", () => {
    expect(orderStatusEnumSchema.options).toEqual([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "IN_TRANSIT",
      "DELIVERED",
      "CANCELED",
    ]);
  });

  it("valida orderItem com lineTotal", () => {
    const parsed = orderItemSchema.parse({
      productId: cuid,
      pharmacyId: cuid,
      quantity: 2,
      unitPrice: money,
      lineTotal: { amount: 2500, currency: "AOA" },
    });
    expect(parsed.lineTotal.amount).toBe(2500);
  });

  it("rejeita orderItem com quantidade acima de 999", () => {
    expect(() =>
      orderItemSchema.parse({
        productId: cuid,
        pharmacyId: cuid,
        quantity: 1000,
        unitPrice: money,
        lineTotal: money,
      }),
    ).toThrow();
  });

  it("valida order completo com totals", () => {
    const order = orderSchema.parse({
      id: cuid,
      organizationId: uuid,
      marketCode: "AO",
      customerId: "cust-1",
      items: [
        {
          productId: cuid,
          pharmacyId: cuid,
          quantity: 1,
          unitPrice: money,
          lineTotal: money,
        },
      ],
      totals: {
        subtotal: money,
        deliveryFee: { amount: 500, currency: "AOA" },
        vat: { amount: 0, currency: "AOA" },
        total: { amount: 1750, currency: "AOA" },
      },
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(order.status).toBe("PENDING");
    expect(order.items).toHaveLength(1);
  });

  it("aceita history com transição from/to", () => {
    const h = orderStatusHistorySchema.parse({
      id: cuid,
      orderId: cuid,
      from: "PENDING",
      to: "CONFIRMED",
      createdAt: new Date(),
    });
    expect(h.to).toBe("CONFIRMED");
    expect(h.from).toBe("PENDING");
  });

  it("rejeita history com estado desconhecido", () => {
    expect(() =>
      orderStatusHistorySchema.parse({
        id: cuid,
        orderId: cuid,
        to: "PAID",
        createdAt: new Date(),
      }),
    ).toThrow();
  });

  it("createOrderInput aceita items mínimos", () => {
    const parsed = createOrderInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      items: [{ productId: cuid, pharmacyId: cuid, quantity: 1 }],
    });
    expect(parsed.items).toHaveLength(1);
  });

  it("rejeita createOrderInput sem items", () => {
    expect(() =>
      createOrderInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        items: [],
      }),
    ).toThrow();
  });
});
