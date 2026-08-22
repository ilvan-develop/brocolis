import { FinPayMockProvider } from "@brocolis/finpay";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { OrdersService } from "../orders/orders.service.js";
import {
  computeWeeklySettlement,
  SettlementsService,
} from "./settlements.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const ORG_OTHER = "00000000-0000-4000-8000-000000000001";
const PH = "c1234567890abcdef00000001";
const PH_OTHER = "c1234567890abcdef00000002";
const ORDER = "c000000000000000000000201";

const scope = { organizationId: ORG, marketCode: "AO" } as const;

type OrderInput = {
  id: string;
  organizationId: string;
  marketCode: string;
  items: Array<{
    productId: string;
    pharmacyId: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
    currency: string;
  }>;
  summary: {
    subtotalMinor: number;
    deliveryFeeMinor: number;
    vatMinor: number;
    discountMinor: number;
    totalMinor: number;
    currency: string;
  };
  splits: Array<{
    pharmacyId: string;
    subtotalMinor: number;
    deliveryFeeMinor: number;
    totalMinor: number;
    currency: string;
  }>;
};

function makeOrder(
  totalMinor: number,
  pharmacyId: string,
  id = ORDER,
): OrderInput {
  return {
    id,
    organizationId: ORG,
    marketCode: "AO",
    items: [
      {
        productId: "c1234567890abcdef00000021",
        pharmacyId,
        quantity: 1,
        unitPriceMinor: totalMinor,
        lineTotalMinor: totalMinor,
        currency: "AOA",
      },
    ],
    summary: {
      subtotalMinor: totalMinor,
      deliveryFeeMinor: 0,
      vatMinor: 0,
      discountMinor: 0,
      totalMinor,
      currency: "AOA",
    },
    splits: [
      {
        pharmacyId,
        subtotalMinor: totalMinor,
        deliveryFeeMinor: 0,
        totalMinor,
        currency: "AOA",
      },
    ],
  };
}

function deliveredOrder(
  orders: OrdersService,
  input: OrderInput,
  when?: Date,
): void {
  orders.place(input);
  for (const to of [
    "CONFIRMED",
    "PROCESSING",
    "IN_TRANSIT",
    "DELIVERED",
  ] as const) {
    orders.advanceStatus(input.id, to);
  }
  if (when) {
    const record = orders
      .listAll(scope.organizationId, scope.marketCode)
      .find((o) => o.id === input.id);
    if (record) {
      record.updatedAt = when;
    }
  }
}

describe("computeWeeklySettlement", () => {
  const now = new Date("2026-08-20T12:00:00Z");

  it("inclui no gross ordens fora da reserva e retém as recentes em reserve", () => {
    const result = computeWeeklySettlement(
      [
        { amountMinor: 10_000, confirmedAt: new Date("2026-08-01T00:00:00Z") },
        { amountMinor: 5_000, confirmedAt: new Date("2026-08-19T00:00:00Z") },
      ],
      { reserveDays: 7, now },
    );
    expect(result.grossMinor).toBe(10_000);
    expect(result.reserveMinor).toBe(5_000);
    expect(result.commissionMinor).toBe(500); // 5% (default 500 bps)
    expect(result.netMinor).toBe(9_500);
  });

  it("aplica taxa de comissão custom sem floats", () => {
    const result = computeWeeklySettlement(
      [{ amountMinor: 25_000, confirmedAt: new Date("2026-08-01T00:00:00Z") }],
      { commissionRateBps: 250, reserveDays: 7, now },
    );
    expect(result.commissionMinor).toBe(625);
    expect(result.netMinor).toBe(24_375);
  });

  it("devolve zeros com período vazio", () => {
    const result = computeWeeklySettlement([], { reserveDays: 7, now });
    expect(result).toEqual({
      grossMinor: 0,
      commissionRateBps: 500,
      commissionMinor: 0,
      reserveMinor: 0,
      netMinor: 0,
    });
  });
});

describe("SettlementsService", () => {
  it("cria settlement a partir de ordens DELIVERED do período, por farmácia", async () => {
    const orders = new OrdersService();
    const finpay = new FinPayMockProvider();
    const service = new SettlementsService(orders, finpay);

    deliveredOrder(
      orders,
      makeOrder(40_000, PH, ORDER),
      new Date("2026-08-01T00:00:00Z"),
    );
    // Mesma organização mas outra farmácia — não entra neste settlement.
    deliveredOrder(
      orders,
      makeOrder(99_000, PH_OTHER, "c000000000000000000000202"),
      new Date("2026-08-02T00:00:00Z"),
    );

    const settlement = await service.createSettlement({
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH,
      periodStart: new Date("2026-07-01T00:00:00Z"),
      periodEnd: new Date("2026-08-20T00:00:00Z"),
    });

    expect(settlement.grossMinor).toBe(40_000);
    expect(settlement.commissionMinor).toBe(2_000); // 5%
    expect(settlement.netMinor).toBe(38_000);
    expect(settlement.reserveMinor).toBe(0);
    expect(settlement.status).toBe("PENDING"); // finpay sem payout → pending_
    expect(settlement.finpayRef).toMatch(/^pending_/);
    expect(settlement.organizationId).toBe(ORG);
    expect(settlement.marketCode).toBe("AO");
    expect(settlement.id).toMatch(/^c/);
  });

  it("retém em reserve ordens posteriores ao cutoff de N dias", async () => {
    const orders = new OrdersService();
    const service = new SettlementsService(orders, new FinPayMockProvider());

    deliveredOrder(
      orders,
      makeOrder(20_000, PH, ORDER),
      new Date("2026-08-18T00:00:00Z"),
    );

    const settlement = await service.createSettlement({
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH,
      periodStart: new Date("2026-07-01T00:00:00Z"),
      periodEnd: new Date("2026-08-20T00:00:00Z"),
    });

    expect(settlement.grossMinor).toBe(0);
    expect(settlement.reserveMinor).toBe(20_000);
    expect(settlement.netMinor).toBe(0);
  });

  it("marca PAID quando o adapter expõe payout", async () => {
    const orders = new OrdersService();
    const adapter = {
      ...new FinPayMockProvider(),
      payout: vi.fn(async () => ({ reference: "payout_settle_abc" })),
    };
    const service = new SettlementsService(orders, adapter as never);

    deliveredOrder(
      orders,
      makeOrder(10_000, PH, ORDER),
      new Date("2026-08-01T00:00:00Z"),
    );

    const settlement = await service.createSettlement({
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH,
      periodStart: new Date("2026-07-01T00:00:00Z"),
      periodEnd: new Date("2026-08-20T00:00:00Z"),
    });

    expect(settlement.status).toBe("PAID");
    expect(settlement.finpayRef).toBe("payout_settle_abc");
    expect(adapter.payout).toHaveBeenCalledWith(
      expect.objectContaining({
        settlementId: settlement.id,
        pharmacyId: PH,
        amountMinor: 9_500,
        currency: "AOA",
        organizationId: ORG,
        marketCode: "AO",
      }),
    );
  });

  it("isola settlements por organização/mercado no getSettlement", async () => {
    const orders = new OrdersService();
    const service = new SettlementsService(orders, new FinPayMockProvider());

    deliveredOrder(
      orders,
      makeOrder(10_000, PH, ORDER),
      new Date("2026-08-01T00:00:00Z"),
    );
    const created = await service.createSettlement({
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH,
      periodStart: new Date("2026-07-01T00:00:00Z"),
      periodEnd: new Date("2026-08-20T00:00:00Z"),
    });

    const found = service.getSettlement(ORG, "AO", created.id);
    expect(found.id).toBe(created.id);

    expect(() => service.getSettlement(ORG_OTHER, "AO", created.id)).toThrow(
      NotFoundException,
    );
    expect(() => service.getSettlement(ORG, "KE", created.id)).toThrow(
      NotFoundException,
    );
  });

  it("valida taxa de comissão (0..10000 bps)", () => {
    const service = new SettlementsService(
      new OrdersService(),
      new FinPayMockProvider(),
    );
    service.setCommissionRate(ORG, "AO", 300);
    expect(service.commissionRateFor(ORG, "AO")).toBe(300);
    expect(() => service.setCommissionRate(ORG, "AO", -1)).toThrow(
      BadRequestException,
    );
    expect(() => service.setCommissionRate(ORG, "AO", 10001)).toThrow(
      BadRequestException,
    );
  });

  it("usa 500 bps por omissão e regista audit trail no create", async () => {
    const orders = new OrdersService();
    const service = new SettlementsService(orders, new FinPayMockProvider());

    expect(service.commissionRateFor(ORG, "AO")).toBe(500);

    deliveredOrder(
      orders,
      makeOrder(1_000, PH, ORDER),
      new Date("2026-08-01T00:00:00Z"),
    );
    await service.createSettlement({
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH,
      periodStart: new Date("2026-07-01T00:00:00Z"),
      periodEnd: new Date("2026-08-20T00:00:00Z"),
    });

    const events = service.getAuditEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events.at(-1)).toMatchObject({
      organizationId: ORG,
      marketCode: "AO",
      action: "settlement.computed",
      resourceType: "pharmacy_settlement",
    });
  });
});
