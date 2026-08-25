import { describe, expect, it } from "vitest";
import { AuditService } from "./audit.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const ORG_OTHER = "00000000-0000-4000-8000-000000000001";
const MARKET = "AO";

const baseEntry = {
  organizationId: ORG,
  marketCode: MARKET,
  actorType: "pharmacy",
  actorId: "pharm-001",
  action: "b2b2c.order.created",
  resourceType: "b2b2c_order",
  resourceId: "c00000000000000000000001",
  payload: { itemCount: 2 },
};

describe("AuditService — record", () => {
  it("records an event with id and at", async () => {
    const svc = new AuditService();
    await svc.record(baseEntry);
    const all = await svc.listAll(ORG, MARKET);
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toMatch(/^c/);
    expect(all[0]?.at).toBeInstanceOf(Date);
    expect(all[0]?.action).toBe("b2b2c.order.created");
  });

  it("records multiple events", async () => {
    const svc = new AuditService();
    await svc.record(baseEntry);
    await svc.record({ ...baseEntry, action: "b2b2c.pharmacy.confirmed" });
    expect(await svc.listAll(ORG, MARKET)).toHaveLength(2);
  });
});

describe("AuditService — listAll", () => {
  it("filters by organizationId and marketCode", async () => {
    const svc = new AuditService();
    await svc.record(baseEntry);
    await svc.record({ ...baseEntry, organizationId: ORG_OTHER });
    expect(await svc.listAll(ORG, MARKET)).toHaveLength(1);
    expect(await svc.listAll(ORG_OTHER, MARKET)).toHaveLength(1);
  });

  it("returns empty for unknown org", async () => {
    const svc = new AuditService();
    await svc.record(baseEntry);
    expect(await svc.listAll("nonexistent", MARKET)).toHaveLength(0);
  });
});

describe("AuditService — query", () => {
  it("filters by action", async () => {
    const svc = new AuditService();
    await svc.record(baseEntry);
    await svc.record({ ...baseEntry, action: "b2b2c.delivery.completed" });
    const result = await svc.query({
      organizationId: ORG,
      marketCode: MARKET,
      action: "b2b2c.order.created",
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.action).toBe("b2b2c.order.created");
  });

  it("filters by subjectType (actorType)", async () => {
    const svc = new AuditService();
    await svc.record({ ...baseEntry, actorType: "PHARMACY" });
    await svc.record({ ...baseEntry, actorType: "SUPPLIER" });
    const result = await svc.query({
      organizationId: ORG,
      marketCode: MARKET,
      subjectType: "PHARMACY",
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.actorType).toBe("PHARMACY");
  });

  it("filters by subjectId (resourceId)", async () => {
    const svc = new AuditService();
    await svc.record(baseEntry);
    await svc.record({ ...baseEntry, resourceId: "other-resource" });
    const result = await svc.query({
      organizationId: ORG,
      marketCode: MARKET,
      subjectId: "c00000000000000000000001",
    });
    expect(result).toHaveLength(1);
  });

  it("filters by date range", async () => {
    const svc = new AuditService();
    const now = new Date();
    const past = new Date(now.getTime() - 100_000);
    const future = new Date(now.getTime() + 100_000);

    await svc.record(baseEntry);
    const result = await svc.query({
      organizationId: ORG,
      marketCode: MARKET,
      from: past,
      to: future,
    });
    expect(result).toHaveLength(1);
  });

  it("returns empty when date range excludes events", async () => {
    const svc = new AuditService();
    await svc.record(baseEntry);
    const result = await svc.query({
      organizationId: ORG,
      marketCode: MARKET,
      from: new Date(2099, 0, 1),
      to: new Date(2099, 11, 31),
    });
    expect(result).toHaveLength(0);
  });

  it("combines multiple filters", async () => {
    const svc = new AuditService();
    await svc.record(baseEntry);
    await svc.record({ ...baseEntry, action: "b2b2c.delivery.completed" });
    await svc.record({ ...baseEntry, resourceId: "other" });
    const result = await svc.query({
      organizationId: ORG,
      marketCode: MARKET,
      action: "b2b2c.order.created",
      subjectId: "c00000000000000000000001",
    });
    expect(result).toHaveLength(1);
  });

  it("rejects query with to before from", async () => {
    const svc = new AuditService();
    await expect(
      svc.query({
        organizationId: ORG,
        marketCode: MARKET,
        from: new Date(2099, 0, 1),
        to: new Date(2020, 0, 1),
      }),
    ).rejects.toThrow();
  });
});

describe("AuditService — exportCsv", () => {
  it("generates CSV header and rows", async () => {
    const svc = new AuditService();
    await svc.record(baseEntry);
    await svc.record({ ...baseEntry, action: "b2b2c.pharmacy.confirmed" });
    const entries = await svc.listAll(ORG, MARKET);
    const csv = svc.exportCsv(entries);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "id,organizationId,marketCode,actorType,actorId,action,resourceType,resourceId,at",
    );
    expect(lines).toHaveLength(3);
  });

  it("returns header only for empty entries", async () => {
    const svc = new AuditService();
    const csv = svc.exportCsv([]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
  });
});
