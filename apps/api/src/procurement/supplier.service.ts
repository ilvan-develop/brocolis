import { Injectable, NotFoundException } from "@nestjs/common";
import { nextCuid } from "../cuid.js";

export type SupplierRecord = {
  id: string;
  organizationId: string;
  marketCode: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  contactEmail?: string;
  contactPhone?: string;
  address?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSupplierInput = {
  organizationId: string;
  marketCode: string;
  name: string;
  slug: string;
  contactEmail?: string;
  contactPhone?: string;
};

@Injectable()
export class SupplierService {
  private readonly suppliers = new Map<string, SupplierRecord>();

  create(input: CreateSupplierInput): SupplierRecord {
    const id = nextCuid();
    const now = new Date();
    const record: SupplierRecord = {
      id,
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      name: input.name,
      slug: input.slug,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
      ...(input.contactEmail ? { contactEmail: input.contactEmail } : {}),
      ...(input.contactPhone ? { contactPhone: input.contactPhone } : {}),
    };
    this.suppliers.set(id, record);
    return record;
  }

  getById(
    organizationId: string,
    marketCode: string,
    supplierId: string,
  ): SupplierRecord {
    const supplier = this.suppliers.get(supplierId);
    if (
      !supplier ||
      supplier.organizationId !== organizationId ||
      supplier.marketCode !== marketCode
    ) {
      throw new NotFoundException(`Fornecedor ${supplierId} não encontrado`);
    }
    return supplier;
  }

  listByOrg(
    organizationId: string,
    marketCode: string,
    page = 1,
    pageSize = 20,
  ): {
    items: SupplierRecord[];
    total: number;
    page: number;
    pageSize: number;
  } {
    const filtered = [...this.suppliers.values()]
      .filter(
        (s) =>
          s.organizationId === organizationId && s.marketCode === marketCode,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }
}
