import { beforeEach, vi } from "vitest";

type AnyRecord = Record<string, unknown>;
type WhereInput = AnyRecord;

function matchesWhere(record: AnyRecord, where: WhereInput): boolean {
  const { AND, OR, NOT, ...rest } = where;
  if (AND) {
    return AND.every((condition: AnyRecord) => matchesWhere(record, condition));
  }
  if (OR) {
    return OR.some((condition: AnyRecord) => matchesWhere(record, condition));
  }
  if (NOT) {
    return !matchesWhere(record, NOT);
  }
  for (const [key, value] of Object.entries(rest)) {
    if ((record as AnyRecord)[key] !== value) return false;
  }
  return true;
}

function filterRecords(records: AnyRecord[], where: WhereInput): AnyRecord[] {
  return records.filter((record) => matchesWhere(record, where));
}

function sortRecords(records: AnyRecord[], orderBy: AnyRecord): AnyRecord[] {
  const entries = Object.entries(orderBy);
  if (entries.length === 0) return records;
  const [field, direction] = entries[0];
  return [...records].sort((a, b) => {
    const aVal = (a as AnyRecord)[field];
    const bVal = (b as AnyRecord)[field];
    let cmp = 0;
    if (aVal === null || aVal === undefined) cmp = 1;
    else if (bVal === null || bVal === undefined) cmp = -1;
    else if (typeof aVal === "number" && typeof bVal === "number") {
      cmp = aVal - bVal;
    } else if (aVal instanceof Date && bVal instanceof Date) {
      cmp = aVal.getTime() - bVal.getTime();
    } else {
      cmp = String(aVal).localeCompare(String(bVal));
    }
    return direction === "desc" ? -cmp : cmp;
  });
}

let counter = 0;

function createStore<T extends AnyRecord>(initial: T[] = []) {
  const records: T[] = initial;

  const reset = () => {
    records.length = 0;
  };

  const nextId = (prefix = "") =>
    `${prefix}${(counter++).toString(36).padStart(12, "0")}`;

  return {
    reset,
    create: ({ data }: { data: Partial<T> }): T => {
      const now = new Date();
      const record = {
        ...data,
        id: data.id ?? nextId(),
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      } as T;
      records.push(record);
      return record;
    },
    findUnique: ({ where }: { where: WhereInput }): T | null => {
      return records.find((r) => matchesWhere(r, where)) ?? null;
    },
    findFirst: ({ where }: { where: WhereInput }): T | null => {
      return records.find((r) => matchesWhere(r, where)) ?? null;
    },
    findMany: ({
      where,
      skip,
      take,
      orderBy,
    }: {
      where?: WhereInput;
      skip?: number;
      take?: number;
      orderBy?: AnyRecord;
    }): T[] => {
      let result = where ? filterRecords(records, where) : [...records];
      if (orderBy) {
        result = sortRecords(result, orderBy);
      }
      if (typeof skip === "number") {
        result = result.slice(skip);
      }
      if (typeof take === "number") {
        result = result.slice(0, take);
      }
      return result;
    },
    count: ({ where }: { where: WhereInput }): number => {
      return filterRecords(records, where).length;
    },
    update: ({ where, data }: { where: WhereInput; data: Partial<T> }): T => {
      const index = records.findIndex((r) => matchesWhere(r, where));
      if (index === -1) {
        throw new Error(`Record not found for update`);
      }
      records[index] = {
        ...records[index],
        ...data,
        id: records[index].id,
      } as T;
      return records[index];
    },
    upsert: ({
      where,
      create,
      update,
    }: {
      where: WhereInput;
      create: Partial<T>;
      update: Partial<T>;
    }): T => {
      const existing = records.find((r) => matchesWhere(r, where));
      if (existing) {
        const index = records.indexOf(existing);
        records[index] = { ...existing, ...update, id: existing.id } as T;
        return records[index];
      }
      const record = { ...create, id: create.id ?? nextId() } as T;
      records.push(record);
      return record;
    },
  };
}

const stores = {
  supplier: createStore<any[]>(),
  rfq: createStore<any[]>(),
  quotation: createStore<any[]>(),
  po: createStore<any[]>(),
  approval: createStore<any[]>(),
  credit: createStore<any[]>(),
  policy: createStore<any[]>(),
  decision: createStore<any[]>(),
  saft: createStore<any[]>(),
  audit: createStore<any[]>(),
  b2b2c: createStore<any[]>(),
  timeline: createStore<any[]>(),
};

beforeEach(() => {
  counter = 0;
  Object.values(stores).forEach((store) => store.reset());
});

vi.mock("@brocolis/db", () => {
  return {
    database: () => ({
      regulatoryPolicy: {
        findMany: () => stores.policy.findMany({}),
        findUnique: ({ where }: any) => stores.policy.findFirst({ where }),
        upsert: ({ where, create, update }: any) =>
          stores.policy.upsert({ where, create, update }),
      },
      complianceDecision: {
        findMany: ({ where }: any) => stores.decision.findMany({ where }),
        create: ({ data }: any) => stores.decision.create({ data }),
        findFirst: ({ where }: any) => stores.decision.findFirst({ where }),
        count: ({ where }: any) => stores.decision.count({ where }),
      },
      saftExportJob: {
        findMany: ({ where }: any) => stores.saft.findMany({ where }),
        create: ({ data }: any) =>
          stores.saft.create({ data: { ...data, status: "QUEUED" } }),
        findFirst: ({ where }: any) => stores.saft.findFirst({ where }),
        count: ({ where }: any) => stores.saft.count({ where }),
      },
      auditEvent: {
        findMany: ({ where }: any) => stores.audit.findMany({ where }),
        create: ({ data }: any) => stores.audit.create({ data }),
      },
      b2b2cOrder: {
        create: ({ data, include }: any) => ({
          ...data,
          id: data.id ?? `c${Date.now().toString(36).padStart(12, "0")}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(include?.items ? { items: [] } : {}),
        }),
        findMany: ({ where }: any) => stores.b2b2c.findMany({ where }),
        findFirst: ({ where }: any) => stores.b2b2c.findFirst({ where }),
        findUnique: ({ where }: any) => stores.b2b2c.findFirst({ where }),
        count: ({ where }: any) => stores.b2b2c.count({ where }),
        update: ({ where, data, include }: any) => ({
          ...data,
          id: where.id,
          ...(include?.items ? { items: [] } : {}),
        }),
      },
      b2b2cOrderTimeline: {
        create: ({ data }: any) => ({
          ...data,
          id: data.id ?? `c${Date.now().toString(36).padStart(12, "0")}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findMany: ({ where }: any) => stores.timeline.findMany({ where }),
      },
      rfq: {
        create: ({ data }: any) => stores.rfq.create({ data }),
        findUnique: ({ where }: any) => stores.rfq.findFirst({ where }),
        findMany: ({ where, skip, take, orderBy }: any) =>
          stores.rfq.findMany({ where, skip, take, orderBy }),
        count: ({ where }: any) => stores.rfq.count({ where }),
        update: ({ where, data }: any) => stores.rfq.update({ where, data }),
      },
      quotation: {
        create: ({ data, include }: any) =>
          stores.quotation.create({
            data: {
              ...data,
              ...(include?.items ? { items: [] } : {}),
            },
          }),
        findUnique: ({ where, include }: any) => {
          const record = stores.quotation.findFirst({ where });
          if (!record) return null;
          return {
            ...record,
            ...(include?.items ? { items: [] } : {}),
          };
        },
        findMany: ({ where }: any) => stores.quotation.findMany({ where }),
        update: ({ where, data, include }: any) => {
          const record = stores.quotation.update({
            where,
            data: { ...data, ...(include?.items ? { items: [] } : {}) },
          });
          return {
            ...record,
            ...(include?.items ? { items: [] } : {}),
          };
        },
      },
      purchaseOrder: {
        create: ({ data, include }: any) =>
          stores.po.create({
            data: {
              ...data,
              ...(include?.items ? { items: [] } : {}),
            },
          }),
        findUnique: ({ where, include }: any) => {
          const record = stores.po.findFirst({ where });
          if (!record) return null;
          return {
            ...record,
            ...(include?.items ? { items: [] } : {}),
          };
        },
        findMany: ({ where, skip, take, orderBy }: any) =>
          stores.po.findMany({ where, skip, take, orderBy }),
        count: ({ where }: any) => stores.po.count({ where }),
        update: ({ where, data, include }: any) => {
          const record = stores.po.update({
            where,
            data: { ...data, ...(include?.items ? { items: [] } : {}) },
          });
          return {
            ...record,
            ...(include?.items ? { items: [] } : {}),
          };
        },
      },
      approvalWorkflow: {
        create: ({ data }: any) => stores.approval.create({ data }),
        findUnique: ({ where }: any) => stores.approval.findFirst({ where }),
        findMany: ({ where }: any) => stores.approval.findMany({ where }),
        update: ({ where, data }: any) =>
          stores.approval.update({ where, data }),
      },
      supplier: {
        create: ({ data }: any) => stores.supplier.create({ data }),
        findUnique: ({ where }: any) => stores.supplier.findFirst({ where }),
        findMany: ({ where, skip, take, orderBy }: any) =>
          stores.supplier.findMany({ where, skip, take, orderBy }),
        count: ({ where }: any) => stores.supplier.count({ where }),
      },
      creditAccount: {
        create: ({ data }: any) => stores.credit.create({ data }),
        findFirst: ({ where }: any) => stores.credit.findFirst({ where }),
        update: ({ where, data }: any) => stores.credit.update({ where, data }),
      },
    }),
  };
});
