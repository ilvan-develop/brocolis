import { describe, expect, it } from "vitest";
import {
  advanceOrder,
  canProsseguir,
  DEMO_PHARMACY_ORDERS,
  filterOrdersByQuery,
  filterOrdersByTab,
  nextOrderAction,
  ORDER_ACTION_KEY,
  orderedCounts,
  orderPrescriptionBadgeKey,
  type PharmacyOrder,
  salesTotal,
} from "./pharmacy-orders";

function orderWith(
  overrides: Partial<Pick<PharmacyOrder, "status" | "ready">>,
): Pick<PharmacyOrder, "status" | "ready"> {
  return {
    status: overrides.status ?? "PENDING",
    ready: overrides.ready ?? false,
  };
}

describe("pharmacy-orders — filtros por estado", () => {
  it("o tab 'all' devolve todos", () => {
    expect(filterOrdersByTab(DEMO_PHARMACY_ORDERS, "all")).toHaveLength(8);
  });

  it("new → pendentes; confirmed → confirmados", () => {
    const pending = filterOrdersByTab(DEMO_PHARMACY_ORDERS, "new");
    expect(pending).toHaveLength(2);
    expect(pending.every((order) => order.status === "PENDING")).toBe(true);

    const confirmed = filterOrdersByTab(DEMO_PHARMACY_ORDERS, "confirmed");
    expect(confirmed).toHaveLength(1);
    expect(confirmed.every((order) => order.status === "CONFIRMED")).toBe(true);
  });

  it("preparing exclui prontos; ready inclui apenas prontos", () => {
    const preparing = filterOrdersByTab(DEMO_PHARMACY_ORDERS, "preparing");
    expect(
      preparing.every((order) => order.status === "PROCESSING" && !order.ready),
    ).toBe(true);

    const ready = filterOrdersByTab(DEMO_PHARMACY_ORDERS, "ready");
    expect(
      ready.every((order) => order.status === "PROCESSING" && order.ready),
    ).toBe(true);
  });

  it("filtro por pesquisa usa número e cliente", () => {
    expect(filterOrdersByQuery(DEMO_PHARMACY_ORDERS, "ANG-1108")).toHaveLength(
      1,
    );
    expect(filterOrdersByQuery(DEMO_PHARMACY_ORDERS, "JOÃO")).toHaveLength(1);
    expect(filterOrdersByQuery(DEMO_PHARMACY_ORDERS, "   ")).toHaveLength(8);
  });
});

describe("pharmacy-orders — progressão do pedido", () => {
  it("mapeia o próximo passo por estado", () => {
    expect(nextOrderAction(orderWith({ status: "PENDING" }))).toEqual({
      step: "confirm",
    });
    expect(nextOrderAction(orderWith({ status: "CONFIRMED" }))).toEqual({
      step: "prepare",
    });
    expect(
      nextOrderAction(orderWith({ status: "PROCESSING", ready: false })),
    ).toEqual({ step: "ready" });
    expect(
      nextOrderAction(orderWith({ status: "PROCESSING", ready: true })),
    ).toEqual({ step: "ship" });
    expect(nextOrderAction(orderWith({ status: "IN_TRANSIT" }))).toEqual({
      step: "deliver",
    });
    expect(nextOrderAction(orderWith({ status: "DELIVERED" }))).toBeNull();
    expect(nextOrderAction(orderWith({ status: "CANCELED" }))).toBeNull();
  });

  it("ORDER_ACTION_KEY cobre todos os passos", () => {
    expect(ORDER_ACTION_KEY).toHaveProperty("confirm");
    expect(ORDER_ACTION_KEY).toHaveProperty("prepare");
    expect(ORDER_ACTION_KEY).toHaveProperty("ready");
    expect(ORDER_ACTION_KEY).toHaveProperty("ship");
    expect(ORDER_ACTION_KEY).toHaveProperty("deliver");
  });

  it("canProsseguir distingue terminais", () => {
    expect(canProsseguir(orderWith({ status: "PENDING" }))).toBe(true);
    expect(canProsseguir(orderWith({ status: "IN_TRANSIT" }))).toBe(true);
    expect(canProsseguir(orderWith({ status: "DELIVERED" }))).toBe(false);
    expect(canProsseguir(orderWith({ status: "CANCELED" }))).toBe(false);
  });

  it("advanceOrder avança o estado sem mutar o original", () => {
    const base = {
      ...(DEMO_PHARMACY_ORDERS[0] ?? orderWith({ status: "PENDING" })),
    };
    const next = advanceOrder(base as PharmacyOrder);
    expect(next.status).toBe("CONFIRMED");
    expect(base.status).toBe("PENDING");
  });

  it("advanceOrder num terminal devolve o pedido", () => {
    const delivered = { ...DEMO_PHARMACY_ORDERS[6]! };
    expect(advanceOrder(delivered)).toBe(delivered);
  });
});

describe("pharmacy-orders — KPIs e badges", () => {
  it("contabiliza por estado", () => {
    const counts = orderedCounts(DEMO_PHARMACY_ORDERS);
    expect(counts.total).toBe(8);
    expect(counts.pending).toBe(2);
    expect(counts.delivered).toBe(1);
    expect(counts.canceled).toBe(1);
  });

  it("salesTotal ignora cancelados", () => {
    const sales = salesTotal(DEMO_PHARMACY_ORDERS);
    expect(sales).not.toBeNull();
    const canceledSum =
      DEMO_PHARMACY_ORDERS.find((o) => o.status === "CANCELED")?.totals.total
        .amount ?? 0;
    const expected = DEMO_PHARMACY_ORDERS.reduce(
      (sum, o) => (o.status === "CANCELED" ? sum : sum + o.totals.total.amount),
      0,
    );
    expect(sales?.amount).toBe(expected);
    expect(canceledSum).toBeGreaterThan(0);
  });

  it("badge da receita por validação", () => {
    expect(orderPrescriptionBadgeKey({ required: false, status: null })).toBe(
      "pharmacy.orders.prescription.notRequired",
    );
    expect(
      orderPrescriptionBadgeKey({ required: true, status: "APPROVED" }),
    ).toBe("pharmacy.orders.prescription.approved");
    expect(
      orderPrescriptionBadgeKey({ required: true, status: "PENDING" }),
    ).toBe("pharmacy.orders.prescription.pending");
    expect(
      orderPrescriptionBadgeKey({ required: true, status: "REJECTED" }),
    ).toBe("pharmacy.orders.prescription.rejected");
  });
});
