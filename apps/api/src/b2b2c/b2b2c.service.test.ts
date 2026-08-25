import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { B2b2cService } from "./b2b2c.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const ORG_OTHER = "00000000-0000-4000-8000-000000000001";
const PHARMACY = "c000000000000000000000001";
const SUPPLIER = "c000000000000000000000002";
const PRODUCT = "c1234567890abcdef00000003";
const MONEY = { amount: 5000, currency: "AOA" };

const baseOrder = {
  organizationId: ORG,
  marketCode: "AO",
  pharmacyId: PHARMACY,
  items: [{ productId: PRODUCT, quantity: 2, unitPrice: MONEY }],
  total: MONEY,
};

function makeDbOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: `c${Math.random().toString(36).slice(2, 14)}`,
    organizationId: ORG,
    marketCode: "AO",
    customerId: null,
    pharmacyId: PHARMACY,
    supplierId: null,
    currentStage: "CONSUMER_ORDER" as const,
    currentStatus: "IN_PROGRESS" as const,
    stockSource: "PHARMACY_STOCK" as const,
    items: baseOrder.items,
    totalMinor: 5000,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeDbTimelineEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: `c${Math.random().toString(36).slice(2, 14)}`,
    orderId: "order-id",
    stage: "CONSUMER_ORDER" as const,
    status: "IN_PROGRESS" as const,
    responsibleParty: "PHARMACY" as const,
    responsibleId: PHARMACY,
    stockSource: "PHARMACY_STOCK" as const,
    note: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("B2b2cService — create order", () => {
  it("creates order with CONSUMER_ORDER stage", async () => {
    const db = {
      b2b2cOrder: {
        create: vi.fn().mockResolvedValue(makeDbOrder()),
      },
      b2b2cTimelineEntry: {
        create: vi.fn(),
      },
      auditEvent: {
        create: vi.fn(),
      },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const order = await svc.createOrder(baseOrder);
    expect(order.id).toMatch(/^c/);
    expect(order.currentStage).toBe("CONSUMER_ORDER");
    expect(order.currentStatus).toBe("IN_PROGRESS");
    expect(order.stockSource).toBe("PHARMACY_STOCK");
    expect(order.items).toHaveLength(1);
  });

  it("creates timeline entry for consumer order", async () => {
    const created = makeDbOrder();
    const timelineStore: Array<Record<string, unknown>> = [];
    const db = {
      b2b2cOrder: {
        create: vi.fn().mockResolvedValue(created),
        findFirst: vi.fn().mockResolvedValue(created),
      },
      b2b2cTimelineEntry: {
        create: vi.fn().mockImplementation(({ data }: any) => {
          const record = {
            ...data,
            id: `c${Date.now().toString(36).padStart(12, "0")}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          timelineStore.push(record);
          return Promise.resolve(record);
        }),
        findMany: vi.fn().mockImplementation(({ where }: any) => {
          let entries = [...timelineStore];
          if (where?.orderId)
            entries = entries.filter((e: any) => e.orderId === where.orderId);
          return Promise.resolve(entries);
        }),
      },
      auditEvent: {
        create: vi.fn(),
      },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const order = await svc.createOrder(baseOrder);
    const tl = await svc.getTimeline({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(tl).toHaveLength(1);
    expect(tl[0]?.stage).toBe("CONSUMER_ORDER");
    expect(tl[0]?.responsibleParty).toBe("PHARMACY");
  });
});

describe("B2b2cService — getOrder / listOrders", () => {
  it("getOrder returns order within scope", async () => {
    const created = makeDbOrder();
    const db = {
      b2b2cOrder: {
        findFirst: vi.fn().mockResolvedValue(created),
        count: vi.fn(),
      },
      b2b2cTimelineEntry: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const found = await svc.getOrder({
      organizationId: ORG,
      marketCode: "AO",
      orderId: created.id,
    });
    expect(found.id).toBe(created.id);
  });

  it("getOrder throws for wrong tenant", async () => {
    const db = {
      b2b2cOrder: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn(),
      },
      b2b2cTimelineEntry: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    await expect(
      svc.getOrder({
        organizationId: ORG_OTHER,
        marketCode: "AO",
        orderId: "c1234567890abcdef00000001",
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("listOrders filters by pharmacyId", async () => {
    const db = {
      b2b2cOrder: {
        findMany: vi.fn().mockImplementation(({ where }: any) => {
          const all = [
            makeDbOrder({ id: "order-1", pharmacyId: PHARMACY }),
            makeDbOrder({ id: "order-2", pharmacyId: SUPPLIER }),
          ];
          if (where?.pharmacyId)
            return Promise.resolve(
              all.filter((o: any) => o.pharmacyId === where.pharmacyId),
            );
          return Promise.resolve(all);
        }),
        count: vi.fn().mockResolvedValue(2),
      },
      b2b2cTimelineEntry: { findMany: vi.fn().mockResolvedValue([]) },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const list = await svc.listOrders({
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PHARMACY,
    });
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.pharmacyId).toBe(PHARMACY);
  });

  it("listOrders filters by stage", async () => {
    const db = {
      b2b2cOrder: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      b2b2cTimelineEntry: { findMany: vi.fn().mockResolvedValue([]) },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const list = await svc.listOrders({
      organizationId: ORG,
      marketCode: "AO",
      stage: "PHARMACY_CONFIRMATION",
    });
    expect(list.items).toHaveLength(0);
  });

  it("listOrders paginates", async () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makeDbOrder({ id: `order-${i}` }),
    );
    const db = {
      b2b2cOrder: {
        findMany: vi.fn().mockResolvedValue(items.slice(0, 2)),
        count: vi.fn().mockResolvedValue(5),
      },
      b2b2cTimelineEntry: { findMany: vi.fn().mockResolvedValue([]) },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const page1 = await svc.listOrders({
      organizationId: ORG,
      marketCode: "AO",
      page: 1,
      pageSize: 2,
    });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(2);
  });
});

describe("B2b2cService — confirmPharmacy", () => {
  it("transitions from CONSUMER_ORDER to PHARMACY_CONFIRMATION", async () => {
    const existing = makeDbOrder();
    const updated = {
      ...existing,
      currentStage: "PHARMACY_CONFIRMATION" as const,
      currentStatus: "COMPLETED" as const,
    };
    const db = {
      b2b2cOrder: {
        findFirst: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue(updated),
        count: vi.fn(),
      },
      b2b2cTimelineEntry: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(makeDbTimelineEntry()),
      },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const confirmed = await svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: existing.id,
      pharmacyId: PHARMACY,
      note: "Stock available",
    });
    expect(confirmed.currentStage).toBe("PHARMACY_CONFIRMATION");
    expect(confirmed.currentStatus).toBe("COMPLETED");
  });

  it("throws if order is not at CONSUMER_ORDER stage", async () => {
    const existing = makeDbOrder({
      currentStage: "PHARMACY_CONFIRMATION" as const,
    });
    const db = {
      b2b2cOrder: {
        findFirst: vi.fn().mockResolvedValue(existing),
        update: vi.fn(),
        count: vi.fn(),
      },
      b2b2cTimelineEntry: { findMany: vi.fn(), create: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    await expect(
      svc.confirmPharmacy({
        organizationId: ORG,
        marketCode: "AO",
        orderId: existing.id,
        pharmacyId: PHARMACY,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe("B2b2cService — pullFromSupplier", () => {
  it("transitions from PHARMACY_CONFIRMATION to SUPPLIER_PULL", async () => {
    const existing = makeDbOrder({
      currentStage: "PHARMACY_CONFIRMATION" as const,
    });
    const updated = {
      ...existing,
      currentStage: "SUPPLIER_PULL" as const,
      currentStatus: "IN_PROGRESS" as const,
      supplierId: SUPPLIER,
      stockSource: "SUPPLIER_PULL" as const,
    };
    const db = {
      b2b2cOrder: {
        findFirst: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue(updated),
        count: vi.fn(),
      },
      b2b2cTimelineEntry: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(makeDbTimelineEntry()),
      },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const pulled = await svc.pullFromSupplier({
      organizationId: ORG,
      marketCode: "AO",
      orderId: existing.id,
      supplierId: SUPPLIER,
      note: "Stock pulled",
    });
    expect(pulled.currentStage).toBe("SUPPLIER_PULL");
    expect(pulled.currentStatus).toBe("IN_PROGRESS");
    expect(pulled.supplierId).toBe(SUPPLIER);
    expect(pulled.stockSource).toBe("SUPPLIER_PULL");
  });

  it("throws if not at PHARMACY_CONFIRMATION", async () => {
    const existing = makeDbOrder({ currentStage: "CONSUMER_ORDER" as const });
    const db = {
      b2b2cOrder: {
        findFirst: vi.fn().mockResolvedValue(existing),
        update: vi.fn(),
        count: vi.fn(),
      },
      b2b2cTimelineEntry: { findMany: vi.fn(), create: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    await expect(
      svc.pullFromSupplier({
        organizationId: ORG,
        marketCode: "AO",
        orderId: existing.id,
        supplierId: SUPPLIER,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe("B2b2cService — markDelivered", () => {
  it("transitions from SUPPLIER_PULL to DELIVERY", async () => {
    const existing = makeDbOrder({ currentStage: "SUPPLIER_PULL" as const });
    const updated = {
      ...existing,
      currentStage: "DELIVERY" as const,
      currentStatus: "COMPLETED" as const,
    };
    const db = {
      b2b2cOrder: {
        findFirst: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue(updated),
        count: vi.fn(),
      },
      b2b2cTimelineEntry: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(makeDbTimelineEntry()),
      },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const delivered = await svc.markDelivered({
      organizationId: ORG,
      marketCode: "AO",
      orderId: existing.id,
    });
    expect(delivered.currentStage).toBe("DELIVERY");
    expect(delivered.currentStatus).toBe("COMPLETED");
  });

  it("transitions from PHARMACY_CONFIRMATION directly to DELIVERY", async () => {
    const existing = makeDbOrder({
      currentStage: "PHARMACY_CONFIRMATION" as const,
    });
    const updated = {
      ...existing,
      currentStage: "DELIVERY" as const,
      currentStatus: "COMPLETED" as const,
    };
    const db = {
      b2b2cOrder: {
        findFirst: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue(updated),
        count: vi.fn(),
      },
      b2b2cTimelineEntry: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(makeDbTimelineEntry()),
      },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const delivered = await svc.markDelivered({
      organizationId: ORG,
      marketCode: "AO",
      orderId: existing.id,
    });
    expect(delivered.currentStage).toBe("DELIVERY");
  });

  it("throws if already delivered", async () => {
    const existing = makeDbOrder({
      currentStage: "DELIVERY" as const,
      currentStatus: "COMPLETED" as const,
    });
    const db = {
      b2b2cOrder: {
        findFirst: vi.fn().mockResolvedValue(existing),
        update: vi.fn(),
        count: vi.fn(),
      },
      b2b2cTimelineEntry: { findMany: vi.fn(), create: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    await expect(
      svc.markDelivered({
        organizationId: ORG,
        marketCode: "AO",
        orderId: existing.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe("B2b2cService — full B2B2C flow", () => {
  it("consumer_order → pharmacy_confirm → supplier_pull → delivery", async () => {
    const orders: Record<string, ReturnType<typeof makeDbOrder>> = {};
    const timelines: Record<string, ReturnType<typeof makeDbTimelineEntry>[]> =
      {};
    const auditCalls: unknown[] = [];

    const db = {
      b2b2cOrder: {
        create: vi
          .fn()
          .mockImplementation(
            async (args: { data: Record<string, unknown> }) => {
              const order = makeDbOrder({
                id: `c${Math.random().toString(36).slice(2, 14)}`,
                ...args.data,
              });
              orders[order.id] = order;
              return order;
            },
          ),
        findFirst: vi
          .fn()
          .mockImplementation(
            async (args: { where: Record<string, unknown> }) => {
              const found = Object.values(orders).find(
                (o) =>
                  o.id === (args.where.id as string) &&
                  o.organizationId === (args.where.organizationId as string) &&
                  o.marketCode === (args.where.marketCode as string),
              );
              return found ?? null;
            },
          ),
        update: vi
          .fn()
          .mockImplementation(
            async (args: {
              where: { id: string };
              data: Record<string, unknown>;
            }) => {
              const existing = orders[args.where.id];
              if (!existing) return makeDbOrder();
              const updated = {
                ...existing,
                ...args.data,
                updatedAt: new Date(),
              };
              orders[updated.id] = updated;
              return updated;
            },
          ),
        count: vi.fn().mockResolvedValue(1),
      },
      b2b2cTimelineEntry: {
        findMany: vi
          .fn()
          .mockImplementation(async (args: { where: { orderId: string } }) => {
            return timelines[args.where.orderId] ?? [];
          }),
        create: vi
          .fn()
          .mockImplementation(
            async (args: { data: Record<string, unknown> }) => {
              const entry = makeDbTimelineEntry(args.data);
              const orderId = args.data.orderId as string;
              timelines[orderId] = timelines[orderId] ?? [];
              timelines[orderId].push(entry);
              return entry;
            },
          ),
      },
      auditEvent: {
        create: vi
          .fn()
          .mockImplementation(
            async (args: { data: Record<string, unknown> }) => {
              auditCalls.push(args.data);
              return { id: `c${Math.random().toString(36).slice(2, 14)}` };
            },
          ),
      },
    };
    vi.mocked(await import("@brocolis/db")).database = vi
      .fn()
      .mockReturnValue(db);

    const svc = new B2b2cService();
    const order = await svc.createOrder(baseOrder);
    expect(order.currentStage).toBe("CONSUMER_ORDER");

    await svc.confirmPharmacy({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      pharmacyId: PHARMACY,
    });

    await svc.pullFromSupplier({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
      supplierId: SUPPLIER,
    });

    await svc.markDelivered({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });

    const finalOrder = orders[order.id];
    expect(finalOrder?.currentStage).toBe("DELIVERY");
    expect(finalOrder?.currentStatus).toBe("COMPLETED");

    const tl = await svc.getTimeline({
      organizationId: ORG,
      marketCode: "AO",
      orderId: order.id,
    });
    expect(tl).toHaveLength(4);
    expect(tl.map((e) => e.stage)).toEqual([
      "CONSUMER_ORDER",
      "PHARMACY_CONFIRMATION",
      "SUPPLIER_PULL",
      "DELIVERY",
    ]);

    expect(
      auditCalls.some(
        (e) => (e as Record<string, unknown>).action === "b2b2c.order.created",
      ),
    ).toBe(true);
    expect(
      auditCalls.some(
        (e) =>
          (e as Record<string, unknown>).action === "b2b2c.pharmacy.confirmed",
      ),
    ).toBe(true);
    expect(
      auditCalls.some(
        (e) =>
          (e as Record<string, unknown>).action ===
          "b2b2c.supplier.pull_started",
      ),
    ).toBe(true);
    expect(
      auditCalls.some(
        (e) =>
          (e as Record<string, unknown>).action === "b2b2c.delivery.completed",
      ),
    ).toBe(true);
  });
});
