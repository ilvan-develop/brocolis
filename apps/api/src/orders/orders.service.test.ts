import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import {
  type OrderStatus,
  OrdersService,
  type PlaceOrderInput,
  validateStatusTransition,
} from "./orders.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const OTHER_ORG = "11111111-1111-4111-8111-111111111111";
const PH_A = "c1234567890abcdef00000001";

function placeOrder(
  orders: OrdersService,
  id: string,
  org = ORG,
  idempotencyKey?: string,
) {
  const input: PlaceOrderInput = {
    id,
    organizationId: org,
    marketCode: "AO",
    items: [
      {
        productId: "c1234567890abcdef00000021",
        pharmacyId: PH_A,
        quantity: 2,
        unitPriceMinor: 250,
        lineTotalMinor: 500,
        currency: "AOA",
      },
    ],
    summary: {
      subtotalMinor: 500,
      deliveryFeeMinor: 2500,
      vatMinor: 0,
      discountMinor: 0,
      totalMinor: 3000,
      currency: "AOA",
    },
    splits: [
      {
        pharmacyId: PH_A,
        subtotalMinor: 500,
        deliveryFeeMinor: 0,
        totalMinor: 500,
        currency: "AOA",
      },
    ],
  };
  return idempotencyKey
    ? orders.place({ ...input, idempotencyKey })
    : orders.place(input);
}

describe("validateStatusTransition", () => {
  it("permite PENDING → CONFIRMED", () => {
    expect(validateStatusTransition("PENDING", "CONFIRMED")).toBe(true);
  });

  it("permite a sequência completa até DELIVERED", () => {
    const flow: [OrderStatus, OrderStatus][] = [
      ["CONFIRMED", "PROCESSING"],
      ["PROCESSING", "IN_TRANSIT"],
      ["IN_TRANSIT", "DELIVERED"],
    ];
    for (const [from, to] of flow) {
      expect(validateStatusTransition(from, to)).toBe(true);
    }
    expect(validateStatusTransition("PENDING", "CANCELED")).toBe(true);
  });

  it("bloqueia saltos ilegais e estado igual", () => {
    expect(validateStatusTransition("PENDING", "DELIVERED")).toBe(false);
    expect(validateStatusTransition("PENDING", "PENDING")).toBe(false);
    expect(validateStatusTransition("CONFIRMED", "IN_TRANSIT")).toBe(false);
  });
});

describe("OrdersService", () => {
  it("place cria order PENDING com histórico inicial", () => {
    const orders = new OrdersService();
    const order = placeOrder(orders, "c000000000000000000000101");
    expect(order.status).toBe("PENDING");
    expect(orders.historyFor(order.id).length).toBeGreaterThan(0);
  });

  it("getOrder respeita o scope tenant+mercado", () => {
    const orders = new OrdersService();
    placeOrder(orders, "c000000000000000000000102");
    expect(() =>
      orders.getOrder({
        orderId: "c000000000000000000000102",
        organizationId: OTHER_ORG,
        marketCode: "AO",
      }),
    ).toThrowError(NotFoundException);
    const found = orders.getOrder({
      orderId: "c000000000000000000000102",
      organizationId: ORG,
      marketCode: "AO",
    });
    expect(found.id).toBe("c000000000000000000000102");
  });

  it("advanceStatus aplica transição válida e regista histórico", () => {
    const orders = new OrdersService();
    placeOrder(orders, "c000000000000000000000103");
    const updated = orders.advanceStatus(
      "c000000000000000000000103",
      "CONFIRMED",
      "pagamento confirmado",
    );
    expect(updated.status).toBe("CONFIRMED");
    expect(orders.historyFor(updated.id)).toHaveLength(2);
  });

  it("rejeita transição inválida", () => {
    const orders = new OrdersService();
    placeOrder(orders, "c000000000000000000000104");
    expect(() =>
      orders.advanceStatus("c000000000000000000000104", "IN_TRANSIT"),
    ).toThrowError(BadRequestException);
  });

  it("listByOrg pagina e filtra por organização", () => {
    const orders = new OrdersService();
    placeOrder(orders, "c000000000000000000000105");
    placeOrder(orders, "c000000000000000000000106");
    placeOrder(orders, "c000000000000000000000107", OTHER_ORG);
    const page1 = orders.listByOrg({
      organizationId: ORG,
      marketCode: "AO",
      page: 1,
      pageSize: 1,
    });
    const page2 = orders.listByOrg({
      organizationId: ORG,
      marketCode: "AO",
      page: 2,
      pageSize: 1,
    });
    expect(page1.items).toHaveLength(1);
    expect(page2.items).toHaveLength(1);
    expect(page1.total).toBe(2);
    expect(page1.items[0]?.id).not.toBe(page2.items[0]?.id);
  });

  it("findByIdempotencyKey é idempotente e scoped", () => {
    const orders = new OrdersService();
    placeOrder(orders, "c000000000000000000000108", ORG, "idem-00000001");
    const first = orders.findByIdempotencyKey(ORG, "AO", "idem-00000001");
    const other = orders.findByIdempotencyKey(OTHER_ORG, "AO", "idem-00000001");
    expect(first?.id).toBe("c000000000000000000000108");
    expect(other).toBeNull();
  });
});
