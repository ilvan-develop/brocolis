import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { SaftExportService } from "./saft-export.service.js";

vi.mock("@brocolis/db", () => {
  const store: Record<string, unknown> = {};
  return {
    database: () => ({
      saftExportJob: {
        create: ({ data }: any) => {
          const record = { ...data, id: `c${Date.now().toString(36).padStart(12, "0")}`, createdAt: new Date(), updatedAt: new Date() };
          store[`job:${record.id}`] = record;
          return Promise.resolve(record);
        },
        findMany: () => Promise.resolve([]),
        findUnique: ({ where }: any) => {
          const record = store[`job:${where.id}`];
          return Promise.resolve(record ?? null);
        },
      },
    }),
  };
});

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "c000000000000000000000201",
    organizationId: "00000000-0000-4000-8000-000000000000",
    marketCode: "AO",
    status: "DELIVERED",
    subtotalAmountMinor: 10000,
    deliveryFeeAmountMinor: 0,
    vatAmountMinor: 0,
    discountAmountMinor: 0,
    totalAmountMinor: 10000,
    currency: "AOA",
    createdAt: new Date("2026-07-01T00:00:00Z"),
    ...overrides,
  };
}

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: "c000000000000000000000301",
    organizationId: "00000000-0000-4000-8000-000000000001",
    marketCode: "AO",
    amountMinor: 10000,
    currency: "AOA",
    method: "CARD",
    status: "CONFIRMED",
    createdAt: new Date("2026-07-01T00:00:00Z"),
    ...overrides,
  };
}

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "c000000000000000000000401",
    organizationId: "00000000-0000-4000-8000-000000000000",
    marketCode: "AO",
    periodStart: new Date("2026-07-01T00:00:00Z"),
    periodEnd: new Date("2026-07-31T23:59:59Z"),
    type: "FULL",
    requestedBy: "platform-admin",
    createdAt: new Date("2026-07-01T00:00:00Z"),
    ...overrides,
  };
}

describe("SaftExportService", () => {
  it("generates XML and marks job as COMPLETED", async () => {
    const db = {
      saftExportJob: {
        findFirst: vi.fn().mockResolvedValue(makeJob()),
        update: vi.fn().mockImplementation(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
          return { ...makeJob(), ...args.data, updatedAt: new Date() };
        }),
      },
      order: {
        findMany: vi.fn().mockResolvedValue([makeOrder()]),
      } as never,
      payment: {
        findMany: vi.fn().mockResolvedValue([makePayment()]),
      } as never,
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const svc = new SaftExportService();
    const result = await svc.generate("c000000000000000000000401");
    expect(result.fileName).toContain("saft-AO-2026");
    expect(result.mimeType).toBe("application/xml");
    expect(result.bytes).toBeGreaterThan(0);

    expect(db.saftExportJob.update).toHaveBeenCalledWith({
      where: { id: "c000000000000000000000401" },
      data: { status: "COMPLETED", fileUrl: "saft://exports/c000000000000000000000401.xml" },
    });
  });

  it("throws when job is not found", async () => {
    const db = {
      saftExportJob: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
      order: { findMany: vi.fn() } as never,
      payment: { findMany: vi.fn() } as never,
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const svc = new SaftExportService();
    await expect(svc.generate("missing")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("marks job as RUNNING before generating", async () => {
    const updates: Record<string, unknown>[] = [];
    const db = {
      saftExportJob: {
        findFirst: vi.fn().mockResolvedValue(makeJob()),
        update: vi.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => {
          updates.push(args.data);
          return { ...makeJob(), ...args.data, updatedAt: new Date() };
        }),
      },
      order: { findMany: vi.fn().mockResolvedValue([]) } as never,
      payment: { findMany: vi.fn().mockResolvedValue([]) } as never,
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const svc = new SaftExportService();
    await svc.generate("c000000000000000000000401");
    expect(updates[0]).toEqual({ status: "RUNNING" });
    expect(updates[1]).toEqual({
      status: "COMPLETED",
      fileUrl: "saft://exports/c000000000000000000000401.xml",
    });
  });

  it("getJob returns null when missing", async () => {
    const db = {
      saftExportJob: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
      order: { findMany: vi.fn() } as never,
      payment: { findMany: vi.fn() } as never,
    };
    vi.mocked(await import("@brocolis/db")).database = vi.fn().mockReturnValue(db);

    const svc = new SaftExportService();
    expect(await svc.getJob("missing")).toBeNull();
  });
});
