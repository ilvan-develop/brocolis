import { vi } from "vitest";

vi.mock("@brocolis/db", () => {
  const store: Record<string, unknown> = {};
  return {
    database: () => ({
      regulatoryPolicy: {
        findMany: () => Promise.resolve([]),
        upsert: ({ where, create, update }: any) => {
          const key = `policy:${where.marketCode}`;
          const existing = store[key] as Record<string, unknown> | undefined;
          const record = existing ? { ...existing, ...update } : { ...create, id: `c${Date.now().toString(36).padStart(12, "0")}`, createdAt: new Date(), updatedAt: new Date() };
          store[key] = record;
          return Promise.resolve(record);
        },
      },
      complianceDecision: {
        findMany: () => Promise.resolve([]),
        create: ({ data }: any) => {
          const record = { ...data, id: `c${Date.now().toString(36).padStart(12, "0")}`, createdAt: new Date(), updatedAt: new Date() };
          return Promise.resolve(record);
        },
      },
      saftExportJob: {
        findMany: () => Promise.resolve([]),
        create: ({ data }: any) => {
          const record = { ...data, id: `c${Date.now().toString(36).padStart(12, "0")}`, createdAt: new Date(), updatedAt: new Date() };
          return Promise.resolve(record);
        },
      },
      b2b2cOrder: {
        create: ({ data }: any) => Promise.resolve({ ...data, id: `c${Date.now().toString(36).padStart(12, "0")}`, createdAt: new Date(), updatedAt: new Date() }),
        findMany: () => Promise.resolve([]),
        findUnique: () => Promise.resolve(null),
        update: ({ where, data }: any) => Promise.resolve({ ...data, id: where.id }),
      },
      rfq: {
        create: ({ data }: any) => Promise.resolve({ ...data, id: `c${Date.now().toString(36).padStart(12, "0")}`, createdAt: new Date(), updatedAt: new Date() }),
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        count: () => Promise.resolve(0),
        update: ({ where, data }: any) => Promise.resolve({ ...data, id: where.id }),
      },
      quotation: {
        create: ({ data, include }: any) => Promise.resolve({ ...data, id: `c${Date.now().toString(36).padStart(12, "0")}`, createdAt: new Date(), updatedAt: new Date(), items: include?.items ? [] : undefined }),
        findUnique: ({ include }: any) => Promise.resolve({ id: "c1", organizationId: "ORG", marketCode: "AO", items: include?.items ? [] : undefined }),
        findMany: () => Promise.resolve([]),
        update: ({ where, data, include }: any) => Promise.resolve({ ...data, id: where.id, items: include?.items ? [] : undefined }),
      },
      purchaseOrder: {
        create: ({ data, include }: any) => Promise.resolve({ ...data, id: `po${Date.now().toString(36).padStart(12, "0")}`, createdAt: new Date(), updatedAt: new Date(), items: include?.items ? [] : undefined }),
        findUnique: ({ include }: any) => Promise.resolve({ id: "po1", organizationId: "ORG", marketCode: "AO", items: include?.items ? [] : undefined }),
        findMany: () => Promise.resolve([]),
        count: () => Promise.resolve(0),
        update: ({ where, data, include }: any) => Promise.resolve({ ...data, id: where.id, items: include?.items ? [] : undefined }),
      },
      approvalWorkflow: {
        create: ({ data }: any) => Promise.resolve({ ...data, id: `ap${Date.now().toString(36).padStart(12, "0")}`, createdAt: new Date(), updatedAt: new Date() }),
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        update: ({ where, data }: any) => Promise.resolve({ ...data, id: where.id }),
      },
      supplier: {
        create: ({ data }: any) => Promise.resolve({ ...data, id: `c${Date.now().toString(36).padStart(12, "0")}`, status: "ACTIVE", createdAt: new Date(), updatedAt: new Date() }),
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        count: () => Promise.resolve(0),
      },
      creditAccount: {
        create: ({ data }: any) => Promise.resolve({ ...data, id: `c${Date.now().toString(36).padStart(12, "0")}`, status: "ACTIVE", balanceMinor: 0, createdAt: new Date(), updatedAt: new Date() }),
        findFirst: () => Promise.resolve(null),
        update: ({ where, data }: any) => Promise.resolve({ ...data, id: where.id }),
      },
    }),
  };
});
