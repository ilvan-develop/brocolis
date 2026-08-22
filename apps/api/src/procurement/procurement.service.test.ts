import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ApprovalService } from "./approval.service.js";
import { CreditService } from "./credit.service.js";
import { PurchaseOrderService } from "./purchase-order.service.js";
import { QuotationService } from "./quotation.service.js";
import { RfqService } from "./rfq.service.js";

vi.mock("@brocolis/db", () => {
  const store: Record<string, unknown> = {};

  const rfqMock = () => ({
    create: ({ data }: { data: Record<string, unknown> }) => {
      const id = `c${Date.now().toString(36).padStart(12, "0")}`;
      const record = { ...data, id, reference: `RFQ-${Date.now().toString(36).toUpperCase()}` };
      store[`rfq:${id}`] = record;
      return Promise.resolve(record);
    },
    findUnique: ({ where }: any) => {
      const key = `rfq:${where.id}`;
      const record = store[key] as Record<string, unknown> | undefined;
      if (!record || (where.organizationId && record.organizationId !== where.organizationId) || (where.marketCode && record.marketCode !== where.marketCode)) {
        return Promise.resolve(null);
      }
      return Promise.resolve(record);
    },
    findMany: ({ where, skip, take }: any) => {
      const w = where as Record<string, unknown>;
      const items = Object.values(store).filter((r) => r && typeof r === "object" && "organizationId" in r && (r as Record<string, unknown>).organizationId === w.organizationId && (r as Record<string, unknown>).marketCode === w.marketCode) as Record<string, unknown>[];
      let filtered = items;
      if (w.status) filtered = filtered.filter((r) => (r as Record<string, unknown>).status === w.status);
      filtered.sort((a, b) => ((b as Record<string, unknown>).createdAt as number) - ((a as Record<string, unknown>).createdAt as number));
      const start = skip ?? 0;
      return Promise.resolve(filtered.slice(start, start + (take ?? filtered.length)));
    },
    count: ({ where }: any) => {
      const items = Object.values(store).filter((r) => r && typeof r === "object" && "organizationId" in r && r.organizationId === where.organizationId && r.marketCode === where.marketCode);
      return Promise.resolve(items.length);
    },
    update: ({ where, data }: any) => {
      const key = `rfq:${where.id}`;
      const record = store[key] as Record<string, unknown> | undefined;
      if (!record) return Promise.resolve({} as Record<string, unknown>);
      Object.assign(record, data);
      store[key] = record;
      return Promise.resolve(record);
    },
  });

  const quotationMock = () => ({
    create: ({ data, include }: any) => {
      const id = `c${Date.now().toString(36).padStart(12, "0")}`;
      const record = { ...data, id, reference: `QT-${Date.now().toString(36).toUpperCase()}` };
      store[`quotation:${id}`] = record;
      if (include?.items) {
        return Promise.resolve({ ...record, items: data.items.create.map((ci: Record<string, unknown>) => ({ ...ci, id: `c${Date.now().toString(36).padStart(12, "0")}` })) });
      }
      return Promise.resolve(record);
    },
    findUnique: ({ where, include }: any) => {
      const key = `quotation:${where.id}`;
      const record = store[key] as Record<string, unknown> | undefined;
      if (!record || (where.organizationId && record.organizationId !== where.organizationId) || (where.marketCode && record.marketCode !== where.marketCode)) {
        return Promise.resolve(null);
      }
      if (include?.items) {
        return Promise.resolve({ ...record, items: (record as Record<string, unknown>).items ?? [] });
      }
      return Promise.resolve(record);
    },
    findMany: ({ where }: any) => {
      const w = where as Record<string, unknown>;
      const items = Object.values(store).filter((r) => r && typeof r === "object" && "organizationId" in r && (r as Record<string, unknown>).organizationId === w.organizationId && (r as Record<string, unknown>).marketCode === w.marketCode && (r as Record<string, unknown>).rfqId === w.rfqId);
      return Promise.resolve(items);
    },
    update: ({ where, data, include }: any) => {
      const key = `quotation:${where.id}`;
      const record = store[key] as Record<string, unknown> | undefined;
      if (!record) return Promise.resolve({} as Record<string, unknown>);
      Object.assign(record, data);
      store[key] = record;
      if (include?.items) {
        return Promise.resolve({ ...record, items: (record as Record<string, unknown>).items ?? [] });
      }
      return Promise.resolve(record);
    },
  });

  const purchaseOrderMock = () => ({
    create: ({ data, include }: any) => {
      const id = `po-${Date.now().toString(36).padStart(12, "0")}`;
      const record = { ...data, id, reference: `PO-${Date.now().toString(36).toUpperCase()}` };
      store[`purchaseOrder:${id}`] = record;
      if (include?.items) {
        return Promise.resolve({ ...record, items: data.items.create.map((ci: Record<string, unknown>) => ({ ...ci, id: `c${Date.now().toString(36).padStart(12, "0")}` })) });
      }
      return Promise.resolve(record);
    },
    findUnique: ({ where, include }: any) => {
      const key = `purchaseOrder:${where.id}`;
      const record = store[key] as Record<string, unknown> | undefined;
      if (!record || (where.organizationId && record.organizationId !== where.organizationId) || (where.marketCode && record.marketCode !== where.marketCode)) {
        return Promise.resolve(null);
      }
      if (include?.items) {
        return Promise.resolve({ ...record, items: (record as Record<string, unknown>).items ?? [] });
      }
      return Promise.resolve(record);
    },
    findMany: ({ where, include, skip, take }: any) => {
      const w = where as Record<string, unknown>;
      let items = Object.values(store).filter((r) => r && typeof r === "object" && "organizationId" in r && (r as Record<string, unknown>).organizationId === w.organizationId && (r as Record<string, unknown>).marketCode === w.marketCode) as Record<string, unknown>[];
      if (w.status) items = items.filter((r) => (r as Record<string, unknown>).status === w.status);
      if (w.supplierId) items = items.filter((r) => (r as Record<string, unknown>).supplierId === w.supplierId);
      items.sort((a, b) => ((b as Record<string, unknown>).createdAt as number) - ((a as Record<string, unknown>).createdAt as number));
      const start = skip ?? 0;
      const result = items.slice(start, start + (take ?? items.length));
      if (include?.items) {
        return Promise.resolve(result.map((r) => ({ ...r, items: (r as Record<string, unknown>).items ?? [] })));
      }
      return Promise.resolve(result);
    },
    count: ({ where }: any) => {
      const w = where as Record<string, unknown>;
      let items = Object.values(store).filter((r) => r && typeof r === "object" && "organizationId" in r && (r as Record<string, unknown>).organizationId === w.organizationId && (r as Record<string, unknown>).marketCode === w.marketCode) as Record<string, unknown>[];
      if (w.status) items = items.filter((r) => (r as Record<string, unknown>).status === w.status);
      if (w.supplierId) items = items.filter((r) => (r as Record<string, unknown>).supplierId === w.supplierId);
      return Promise.resolve(items.length);
    },
    update: ({ where, data, include }: any) => {
      const key = `purchaseOrder:${where.id}`;
      const record = store[key] as Record<string, unknown> | undefined;
      if (!record) return Promise.resolve({} as Record<string, unknown>);
      Object.assign(record, data);
      store[key] = record;
      if (include?.items) {
        return Promise.resolve({ ...record, items: (record as Record<string, unknown>).items ?? [] });
      }
      return Promise.resolve(record);
    },
  });

  const approvalMock = () => ({
    create: ({ data }: any) => {
      const id = `ap-${Date.now().toString(36).padStart(12, "0")}`;
      const record = { ...data, id };
      store[`approval:${id}`] = record;
      return Promise.resolve(record);
    },
    findUnique: ({ where }: any) => {
      const record = store[`approval:${where.id}`] as Record<string, unknown> | undefined;
      return Promise.resolve(record ?? null);
    },
    findMany: ({ where }: any) => {
      const items = Object.values(store).filter((r) => r && typeof r === "object" && "purchaseOrderId" in r && r.purchaseOrderId === where.purchaseOrderId) as Record<string, unknown>[];
      items.sort((a, b) => ((a.level as number) || 0) - ((b.level as number) || 0));
      return Promise.resolve(items);
    },
    update: ({ where, data }: any) => {
      const key = `approval:${where.id}`;
      const record = store[key] as Record<string, unknown> | undefined;
      if (!record) return Promise.resolve({} as Record<string, unknown>);
      Object.assign(record, data);
      store[key] = record;
      return Promise.resolve(record);
    },
  });

  const supplierMock = () => ({
    create: ({ data }: any) => {
      const id = `c${Date.now().toString(36).padStart(12, "0")}`;
      const record = { ...data, id, status: "ACTIVE" };
      store[`supplier:${id}`] = record;
      return Promise.resolve(record);
    },
    findUnique: ({ where }: any) => {
      const key = `supplier:${where.id}`;
      const record = store[key] as Record<string, unknown> | undefined;
      if (!record || (where.organizationId && record.organizationId !== where.organizationId) || (where.marketCode && record.marketCode !== where.marketCode)) {
        return Promise.resolve(null);
      }
      return Promise.resolve(record);
    },
    findMany: ({ where, skip, take }: any) => {
      const items = Object.values(store).filter((r) => r && typeof r === "object" && "organizationId" in r && r.organizationId === where.organizationId && r.marketCode === where.marketCode) as Record<string, unknown>[];
      items.sort((a, b) => (b.createdAt as number) - (a.createdAt as number));
      const start = skip ?? 0;
      return Promise.resolve(items.slice(start, start + (take ?? items.length)));
    },
    count: ({ where }: any) => {
      const items = Object.values(store).filter((r) => r && typeof r === "object" && "organizationId" in r && r.organizationId === where.organizationId && r.marketCode === where.marketCode);
      return Promise.resolve(items.length);
    },
  });

  const creditMock = () => ({
    create: ({ data }: any) => {
      const id = `c${Date.now().toString(36).padStart(12, "0")}`;
      const record = { ...data, id, status: "ACTIVE", balanceMinor: 0 };
      store[`credit:${id}`] = record;
      store[`credit:${data.organizationId}:${data.supplierId}`] = record;
      return Promise.resolve(record);
    },
    findFirst: ({ where }: any) => {
      const key = `credit:${where.organizationId}:${where.supplierId}`;
      const record = store[key] as Record<string, unknown> | undefined;
      return Promise.resolve(record ?? null);
    },
    update: ({ where, data }: any) => {
      const record = store[`credit:${where.id}`] as Record<string, unknown> | undefined;
      if (!record) return Promise.resolve({} as Record<string, unknown>);
      Object.assign(record, data);
      store[`credit:${where.id}`] = record;
      if (record.organizationId && record.supplierId) {
        store[`credit:${record.organizationId}:${record.supplierId}`] = record;
      }
      return Promise.resolve(record);
    },
  });

  return {
    database: () => ({
      rfq: rfqMock(),
      quotation: quotationMock(),
      purchaseOrder: purchaseOrderMock(),
      approvalWorkflow: approvalMock(),
      supplier: supplierMock(),
      creditAccount: creditMock(),
    }),
  };
});

const ORG = "00000000-0000-4000-8000-000000000000";
const OTHER_ORG = "11111111-1111-4111-8111-111111111111";
const SUP = "c1234567890abcdef00000001";
const PROD = "c1234567890abcdef00000021";

describe("RfqService", () => {
  it("creates RFQ in DRAFT status with auto-generated reference", async () => {
    const svc = new RfqService();
    const rfq = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "Compra de Paracetamol",
    });
    expect(rfq.status).toBe("DRAFT");
    expect(rfq.reference).toMatch(/^RFQ-/);
    expect(rfq.organizationId).toBe(ORG);
  });

  it("advances RFQ from DRAFT to OPEN", async () => {
    const svc = new RfqService();
    const rfq = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "Teste",
    });
    const opened = await svc.advanceStatus(rfq.id, "OPEN");
    expect(opened.status).toBe("OPEN");
  });

  it("rejects invalid transition DRAFT → AWARDED", async () => {
    const svc = new RfqService();
    const rfq = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "Teste",
    });
    expect(() => svc.advanceStatus(rfq.id, "AWARDED")).toThrow(
      BadRequestException,
    );
  });

  it("getById respects tenant scope", async () => {
    const svc = new RfqService();
    const rfq = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "Scoped",
    });
    expect(() => svc.getById(OTHER_ORG, "AO", rfq.id)).toThrow(
      NotFoundException,
    );
    const found = await svc.getById(ORG, "AO", rfq.id);
    expect(found.id).toBe(rfq.id);
  });

  it("listByOrg filters by status", async () => {
    const svc = new RfqService();
    await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "A",
    });
    await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      subject: "B",
    });
    const all = await svc.listByOrg({
      organizationId: ORG,
      marketCode: "AO",
    });
    expect(all.items).toHaveLength(2);
    expect(all.total).toBe(2);
  });
});

describe("QuotationService", () => {
  it("creates quotation with items", async () => {
    const svc = new QuotationService();
    const qt = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      rfqId: "c1234567890abcdef00000002",
      supplierId: SUP,
      totalAmountMinor: 50000,
      items: [{ productId: PROD, quantity: 10, unitPriceMinor: 5000 }],
    });
    expect(qt.status).toBe("DRAFT");
    expect(qt.items).toHaveLength(1);
    expect(qt.reference).toMatch(/^QT-/);
  });

  it("advances quotation from DRAFT to SUBMITTED", async () => {
    const svc = new QuotationService();
    const qt = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      rfqId: "c1234567890abcdef00000003",
      supplierId: SUP,
      totalAmountMinor: 75000,
      items: [{ productId: PROD, quantity: 15, unitPriceMinor: 5000 }],
    });
    const submitted = await svc.advanceStatus(qt.id, "SUBMITTED");
    expect(submitted.status).toBe("SUBMITTED");
  });

  it("rejects transition DRAFT → ACCEPTED", async () => {
    const svc = new QuotationService();
    const qt = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      rfqId: "c1234567890abcdef00000004",
      supplierId: SUP,
      totalAmountMinor: 10000,
      items: [{ productId: PROD, quantity: 2, unitPriceMinor: 5000 }],
    });
    expect(() => svc.advanceStatus(qt.id, "ACCEPTED")).toThrow(
      BadRequestException,
    );
  });
});

describe("PurchaseOrderService", () => {
  it("creates PO in DRAFT status", async () => {
    const svc = new PurchaseOrderService();
    const po = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      totalAmountMinor: 100000,
      items: [
        {
          productId: PROD,
          quantity: 20,
          unitPriceMinor: 5000,
          lineTotalMinor: 100000,
          currency: "AOA",
        },
      ],
    });
    expect(po.status).toBe("DRAFT");
    expect(po.reference).toMatch(/^PO-/);
  });

  it("advances PO through full lifecycle", async () => {
    const svc = new PurchaseOrderService();
    const po = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      totalAmountMinor: 100000,
      items: [
        {
          productId: PROD,
          quantity: 20,
          unitPriceMinor: 5000,
          lineTotalMinor: 100000,
          currency: "AOA",
        },
      ],
    });
    let current = await svc.advanceStatus(po.id, "PENDING_APPROVAL");
    expect(current.status).toBe("PENDING_APPROVAL");
    current = await svc.advanceStatus(po.id, "APPROVED");
    expect(current.status).toBe("APPROVED");
    current = await svc.advanceStatus(po.id, "CONFIRMED");
    expect(current.status).toBe("CONFIRMED");
    current = await svc.advanceStatus(po.id, "IN_DELIVERY");
    expect(current.status).toBe("IN_DELIVERY");
    current = await svc.advanceStatus(po.id, "DELIVERED");
    expect(current.status).toBe("DELIVERED");
    current = await svc.advanceStatus(po.id, "COMPLETED");
    expect(current.status).toBe("COMPLETED");
  });

  it("rejects jump from DRAFT to CONFIRMED", async () => {
    const svc = new PurchaseOrderService();
    const po = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      totalAmountMinor: 10000,
      items: [
        {
          productId: PROD,
          quantity: 2,
          unitPriceMinor: 5000,
          lineTotalMinor: 10000,
          currency: "AOA",
        },
      ],
    });
    expect(() => svc.advanceStatus(po.id, "CONFIRMED")).toThrow(
      BadRequestException,
    );
  });

  it("getById respects scope", async () => {
    const svc = new PurchaseOrderService();
    const po = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      totalAmountMinor: 10000,
      items: [
        {
          productId: PROD,
          quantity: 2,
          unitPriceMinor: 5000,
          lineTotalMinor: 10000,
          currency: "AOA",
        },
      ],
    });
    expect(() => svc.getById(OTHER_ORG, "AO", po.id)).toThrow(
      NotFoundException,
    );
  });
});

describe("ApprovalService", () => {
  it("creates approval in PENDING status", async () => {
    const svc = new ApprovalService();
    const approval = await svc.create("po-1", "user-1");
    expect(approval.status).toBe("PENDING");
    expect(approval.level).toBe(1);
  });

  it("decides approval with APPROVED", async () => {
    const svc = new ApprovalService();
    const approval = await svc.create("po-1", "user-1");
    const decided = await svc.decide({
      approvalId: approval.id,
      decision: "APPROVED",
      approverId: "user-1",
    });
    expect(decided.status).toBe("APPROVED");
    expect(decided.decidedAt).toBeDefined();
  });

  it("rejects decision by wrong approver", async () => {
    const svc = new ApprovalService();
    const approval = await svc.create("po-1", "user-1");
    expect(() =>
      svc.decide({
        approvalId: approval.id,
        decision: "APPROVED",
        approverId: "user-2",
      }),
    ).toThrow(BadRequestException);
  });

  it("rejects double decision", async () => {
    const svc = new ApprovalService();
    const approval = await svc.create("po-1", "user-1");
    await svc.decide({
      approvalId: approval.id,
      decision: "APPROVED",
      approverId: "user-1",
    });
    expect(() =>
      svc.decide({
        approvalId: approval.id,
        decision: "REJECTED",
        approverId: "user-1",
      }),
    ).toThrow(BadRequestException);
  });

  it("hasApproval returns true when all approved", async () => {
    const svc = new ApprovalService();
    const a1 = await svc.create("po-1", "user-1", 1);
    const a2 = await svc.create("po-1", "user-2", 2);
    await svc.decide({
      approvalId: a1.id,
      decision: "APPROVED",
      approverId: "user-1",
    });
    await svc.decide({
      approvalId: a2.id,
      decision: "APPROVED",
      approverId: "user-2",
    });
    expect(svc.hasApproval("po-1")).toBe(true);
  });

  it("hasApproval returns false when pending", async () => {
    const svc = new ApprovalService();
    await svc.create("po-1", "user-1", 1);
    await svc.create("po-1", "user-2", 2);
    expect(svc.hasApproval("po-1")).toBe(false);
  });
});

describe("CreditService", () => {
  it("creates credit account", async () => {
    const svc = new CreditService();
    const acc = await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      creditLimitMinor: 1000000,
    });
    expect(acc.status).toBe("ACTIVE");
    expect(acc.creditLimitMinor).toBe(1000000);
    expect(acc.balanceMinor).toBe(0);
  });

  it("check returns available when within limit", async () => {
    const svc = new CreditService();
    await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      creditLimitMinor: 1000000,
    });
    const result = await svc.check({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      amountMinor: 500000,
    });
    expect(result.available).toBe(true);
  });

  it("check returns unavailable when exceeding limit", async () => {
    const svc = new CreditService();
    await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      creditLimitMinor: 100000,
    });
    const result = await svc.check({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      amountMinor: 200000,
    });
    expect(result.available).toBe(false);
  });

  it("debit increases balance and credit decreases it", async () => {
    const svc = new CreditService();
    await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      creditLimitMinor: 1000000,
    });
    await svc.debit(ORG, SUP, 300000);
    const afterDebit = await svc.getAccount(ORG, SUP);
    expect(afterDebit?.balanceMinor).toBe(300000);
    await svc.credit(ORG, SUP, 100000);
    const afterCredit = await svc.getAccount(ORG, SUP);
    expect(afterCredit?.balanceMinor).toBe(200000);
  });

  it("debit rejects when exceeding limit", async () => {
    const svc = new CreditService();
    await svc.create({
      organizationId: ORG,
      marketCode: "AO",
      supplierId: SUP,
      creditLimitMinor: 100000,
    });
    expect(() => svc.debit(ORG, SUP, 200000)).toThrow(BadRequestException);
  });

  it("check rejects for non-existent account", async () => {
    const svc = new CreditService();
    expect(() =>
      svc.check({
        organizationId: ORG,
        marketCode: "AO",
        supplierId: "non-existent",
        amountMinor: 1000,
      }),
    ).toThrow(NotFoundException);
  });
});
